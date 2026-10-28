import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { adminAuditStore } from "@/lib/admin-audit";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import { normalizeProductInput, planVariantReplacement, type ProductInput } from "@/lib/catalog-admin";
import { slugify } from "@/lib/utils";

async function getProducts(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { images: { orderBy: [{ isPrimary: "desc" }, { orderIndex: "asc" }] }, variants: { orderBy: [{ size: "asc" }, { color: "asc" }] }, category: true, subcategory: true, collection: true, region: true },
      });
      return product ? NextResponse.json({ product }) : NextResponse.json({ message: "Product not found." }, { status: 404 });
    }
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, include: catalogProductInclude });
    return NextResponse.json({ products: products.map((product) => ({ ...toProductItem(product), status: product.status })) });
  } catch (error) {
    console.error("Admin product lookup failed:", error);
    return NextResponse.json({ message: "Could not load the product catalogue." }, { status: 503 });
  }
}

async function createProduct(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.duplicateFromId === "string") return await duplicateProduct(body.duplicateFromId);
    const normalized = normalizeProductInput(body);
    if (normalized.ok === false) return NextResponse.json({ message: normalized.message }, { status: 400 });
    const taxonomy = await validateTaxonomy(normalized.value);
    if (!taxonomy.ok) return NextResponse.json({ message: taxonomy.message }, { status: 400 });

    const value = normalized.value;
    const product = await prisma.product.create({
      data: {
        title: value.title, slug: slugify(value.title), sku: value.sku,
        categoryId: value.categoryId, subcategoryId: value.subcategoryId, collectionId: value.collectionId, regionId: value.regionId,
        shortDesc: value.shortDesc, description: value.description, culturalStory: value.culturalStory,
        fabricDetails: value.fabricDetails, careInstructions: value.careInstructions, sizeFitGuide: value.sizeFitGuide,
        price: value.price, mrp: value.mrp, costPrice: value.costPrice,
        discount: value.mrp > value.price ? Math.round(((value.mrp - value.price) / value.mrp) * 100) : null,
        stock: value.stock, lowStockAlert: value.lowStockAlert, status: value.status,
        isFeatured: value.isFeatured, isNewArrival: value.isNewArrival, isBestSeller: value.isBestSeller,
        isSale: value.isSale, isLimitedEdition: value.isLimitedEdition, videoUrl: value.videoUrl,
        seoTitle: value.seoTitle, seoDescription: value.seoDescription,
        images: { create: makeImages(value) },
        variants: { create: value.variants.map(({ id: _id, ...variant }) => variant) },
      }, include: catalogProductInclude,
    });
    return NextResponse.json({ product: { ...toProductItem(product), status: product.status } }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ message: "That product title or SKU is already in use. Choose a unique title and SKU." }, { status: 409 });
    console.error("Admin product creation failed:", error);
    return NextResponse.json({ message: "Could not save the product." }, { status: 503 });
  }
}

async function updateProduct(request: Request) {
  try {
    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId : "";
    if (!productId) return NextResponse.json({ message: "Product ID is required." }, { status: 400 });

    if (Object.keys(body).every((key: string) => ["productId", "status"].includes(key))) {
      const status = body.status;
      if (!["ACTIVE", "DRAFT", "OUT_OF_STOCK", "ARCHIVED"].includes(status)) return NextResponse.json({ message: "Choose a valid product status." }, { status: 400 });
      const updated = await prisma.product.updateMany({ where: { id: productId }, data: { status } });
      return updated.count ? NextResponse.json({ success: true, status }) : NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    const normalized = normalizeProductInput(body);
    if (normalized.ok === false) return NextResponse.json({ message: normalized.message }, { status: 400 });
    const value = normalized.value;
    const taxonomy = await validateTaxonomy(value);
    if (!taxonomy.ok) return NextResponse.json({ message: taxonomy.message }, { status: 400 });

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id: productId }, include: { variants: { select: { id: true, _count: { select: { orderItems: true, cartItems: true } } } } } });
      if (!existing) return null;
      const variantPlan = planVariantReplacement(existing.variants.map((variant) => ({ id: variant.id, orderItemCount: variant._count.orderItems, cartItemCount: variant._count.cartItems })), value.variants);
      if (!variantPlan.ok && variantPlan.reason === "VARIANT_IN_USE") throw new ProductVariantInUseError();
      if (!variantPlan.ok) throw new InvalidVariantIdError();

      await tx.product.update({
        where: { id: productId },
        data: {
          title: value.title, slug: slugify(value.title), sku: value.sku,
          categoryId: value.categoryId, subcategoryId: value.subcategoryId, collectionId: value.collectionId, regionId: value.regionId,
          shortDesc: value.shortDesc, description: value.description, culturalStory: value.culturalStory,
          fabricDetails: value.fabricDetails, careInstructions: value.careInstructions, sizeFitGuide: value.sizeFitGuide,
          price: value.price, mrp: value.mrp, costPrice: value.costPrice,
          discount: value.mrp > value.price ? Math.round(((value.mrp - value.price) / value.mrp) * 100) : null,
          stock: value.stock, lowStockAlert: value.lowStockAlert, status: value.status,
          isFeatured: value.isFeatured, isNewArrival: value.isNewArrival, isBestSeller: value.isBestSeller,
          isSale: value.isSale, isLimitedEdition: value.isLimitedEdition, videoUrl: value.videoUrl,
          seoTitle: value.seoTitle, seoDescription: value.seoDescription,
        },
      });
      await tx.productImage.deleteMany({ where: { productId } });
      if (variantPlan.removeIds.length) await tx.productVariant.deleteMany({ where: { productId, id: { in: variantPlan.removeIds } } });
      for (const variant of value.variants) {
        const { id, ...data } = variant;
        if (id) {
          const result = await tx.productVariant.updateMany({ where: { id, productId }, data });
          if (result.count !== 1) throw new InvalidVariantIdError();
        } else {
          await tx.productVariant.create({ data: { ...data, productId } });
        }
      }
      await tx.productImage.createMany({ data: makeImages(value).map((image) => ({ ...image, productId })) });
      return tx.product.findUnique({ where: { id: productId }, include: catalogProductInclude });
    });
    if (!updated) return NextResponse.json({ message: "Product not found." }, { status: 404 });
    return NextResponse.json({ product: { ...toProductItem(updated), status: updated.status } });
  } catch (error: any) {
    if (error instanceof ProductVariantInUseError) return NextResponse.json({ message: "A variant attached to a cart or order cannot be removed." }, { status: 409 });
    if (error instanceof InvalidVariantIdError) return NextResponse.json({ message: "One of the selected variants does not belong to this product." }, { status: 400 });
    if (error?.code === "P2002") return NextResponse.json({ message: "That product title or SKU is already in use. Choose a unique title and SKU." }, { status: 409 });
    console.error("Admin product update failed:", error);
    return NextResponse.json({ message: "Could not update the product." }, { status: 503 });
  }
}

async function archiveProduct(request: Request) {
  try {
    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId : "";
    if (!productId) return NextResponse.json({ message: "Product ID is required." }, { status: 400 });
    const archived = await prisma.product.updateMany({ where: { id: productId }, data: { status: "ARCHIVED" } });
    return archived.count ? NextResponse.json({ success: true, status: "ARCHIVED" }) : NextResponse.json({ message: "Product not found." }, { status: 404 });
  } catch (error) {
    console.error("Admin product archive failed:", error);
    return NextResponse.json({ message: "Could not archive the product." }, { status: 503 });
  }
}

async function duplicateProduct(productId: string) {
  const source = await prisma.product.findUnique({ where: { id: productId }, include: { images: true, variants: true } });
  if (!source) return NextResponse.json({ message: "Product to duplicate was not found." }, { status: 404 });
  const suffix = Date.now().toString(36);
  const product = await prisma.product.create({ data: {
    title: `${source.title} Copy`, slug: `${source.slug}-copy-${suffix}`, sku: `${source.sku}-COPY-${suffix}`.slice(0, 50),
    shortDesc: source.shortDesc, description: source.description, culturalStory: source.culturalStory,
    fabricDetails: source.fabricDetails, careInstructions: source.careInstructions, sizeFitGuide: source.sizeFitGuide,
    price: source.price, mrp: source.mrp, costPrice: source.costPrice, discount: source.discount,
    categoryId: source.categoryId, subcategoryId: source.subcategoryId, collectionId: source.collectionId, regionId: source.regionId,
    status: "DRAFT", stock: 0, lowStockAlert: source.lowStockAlert, videoUrl: source.videoUrl,
    seoTitle: source.seoTitle, seoDescription: source.seoDescription,
    isFeatured: false, isNewArrival: false, isBestSeller: false, isSale: source.isSale, isLimitedEdition: source.isLimitedEdition,
    images: { create: source.images.map((image) => ({ url: image.url, altText: image.altText, orderIndex: image.orderIndex, isPrimary: image.isPrimary })) },
    variants: { create: source.variants.map((variant) => ({ sku: `${variant.sku}-COPY-${suffix}`.slice(0, 50), size: variant.size, color: variant.color, colorCode: variant.colorCode, stock: 0, additionalPrice: variant.additionalPrice })) },
  }, include: catalogProductInclude });
  return NextResponse.json({ product: { ...toProductItem(product), status: product.status } }, { status: 201 });
}

async function validateTaxonomy(value: ProductInput) {
  const category = await prisma.category.findUnique({ where: { id: value.categoryId }, select: { id: true } });
  if (!category) return { ok: false as const, message: "Choose an existing product category." };
  if (value.subcategoryId) {
    const subcategory = await prisma.subcategory.findFirst({ where: { id: value.subcategoryId, categoryId: value.categoryId }, select: { id: true } });
    if (!subcategory) return { ok: false as const, message: "Choose a subcategory within the selected category." };
  }
  if (value.collectionId && !await prisma.collection.findUnique({ where: { id: value.collectionId }, select: { id: true } })) return { ok: false as const, message: "Choose an existing collection." };
  if (value.regionId && !await prisma.region.findUnique({ where: { id: value.regionId }, select: { id: true } })) return { ok: false as const, message: "Choose an existing cultural region." };
  return { ok: true as const };
}

function makeImages(value: Pick<ProductInput, "images" | "primaryImageIndex" | "title">) {
  return value.images.map(({ url, altText }, orderIndex) => ({ url, altText: altText || value.title, orderIndex, isPrimary: orderIndex === value.primaryImageIndex }));
}

class ProductVariantInUseError extends Error {}
class InvalidVariantIdError extends Error {}

function createAdminProductHandlers(authorize = requireAdminCapability) {
  return {
    GET: withAdminCapability(ADMIN_API_CAPABILITIES.products.methods.GET, getProducts, authorize),
    POST: withAdminCapability(ADMIN_API_CAPABILITIES.products.methods.POST, createProduct, authorize, adminAuditStore),
    PATCH: withAdminCapability(ADMIN_API_CAPABILITIES.products.methods.PATCH, updateProduct, authorize, adminAuditStore),
    DELETE: withAdminCapability(ADMIN_API_CAPABILITIES.products.methods.DELETE, archiveProduct, authorize, adminAuditStore),
  };
}

const handlers = createAdminProductHandlers();
export const { GET, POST, PATCH, DELETE } = handlers;
