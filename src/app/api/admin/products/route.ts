import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminUser } from "@/lib/account-auth";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import { CATEGORIES, REGIONS } from "@/lib/sample-data";
import { slugify } from "@/lib/utils";

export async function GET() {
  if (!await getAdminUser()) return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, include: catalogProductInclude });
    return NextResponse.json({ products: products.map((product) => ({ ...toProductItem(product), status: product.status })) });
  } catch (error) {
    console.error("Admin product lookup failed:", error);
    return NextResponse.json({ message: "Could not load the product catalogue." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await getAdminUser()) return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body?.duplicateFromId === "string") {
      const source = await prisma.product.findUnique({ where: { id: body.duplicateFromId }, include: { images: true, variants: true } });
      if (!source) return NextResponse.json({ message: "Product to duplicate was not found." }, { status: 404 });
      const suffix = Date.now().toString(36);
      const product = await prisma.product.create({ data: {
        title: `${source.title} Copy`, slug: `${source.slug}-copy-${suffix}`, sku: `${source.sku}-COPY-${suffix}`,
        shortDesc: source.shortDesc, description: source.description, culturalStory: source.culturalStory,
        fabricDetails: source.fabricDetails, careInstructions: source.careInstructions, sizeFitGuide: source.sizeFitGuide,
        price: source.price, mrp: source.mrp, costPrice: source.costPrice, discount: source.discount,
        categoryId: source.categoryId, subcategoryId: source.subcategoryId, collectionId: source.collectionId, regionId: source.regionId,
        status: "DRAFT", stock: 0, lowStockAlert: source.lowStockAlert, videoUrl: source.videoUrl,
        seoTitle: source.seoTitle, seoDescription: source.seoDescription,
        isFeatured: false, isNewArrival: false, isBestSeller: false, isSale: source.isSale, isLimitedEdition: source.isLimitedEdition,
        images: { create: source.images.map((image) => ({ url: image.url, altText: image.altText, orderIndex: image.orderIndex, isPrimary: image.isPrimary })) },
        variants: { create: source.variants.map((variant) => ({ sku: `${variant.sku}-COPY-${suffix}`, size: variant.size, color: variant.color, colorCode: variant.colorCode, stock: 0, additionalPrice: variant.additionalPrice })) },
      }, include: catalogProductInclude });
      return NextResponse.json({ product: { ...toProductItem(product), status: product.status } }, { status: 201 });
    }

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const sku = typeof body?.sku === "string" ? body.sku.trim().toUpperCase() : "";
    const categorySlug = typeof body?.category === "string" ? body.category.trim().toLowerCase() : "";
    const regionSlug = typeof body?.region === "string" ? body.region.trim().toLowerCase() : "";
    const price = Number(body?.price);
    const mrp = Number(body?.mrp);
    const stock = Number(body?.stock);
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (title.length < 3 || title.length > 180 || !/^[A-Z0-9_-]{3,50}$/.test(sku) || !categorySlug || !regionSlug ||
        !Number.isFinite(price) || price <= 0 || !Number.isFinite(mrp) || mrp < price || !Number.isInteger(stock) || stock < 0 || stock > 100000 ||
        !isAllowedImageUrl(imageUrl)) {
      return NextResponse.json({ message: "Check the product title, SKU, category, region, price, stock, and image URL." }, { status: 400 });
    }

    const categoryInfo = CATEGORIES.find((category) => category.slug === categorySlug);
    if (!categoryInfo) return NextResponse.json({ message: "Choose a valid product category." }, { status: 400 });
    const regionInfo = REGIONS.find((region) => region.slug === regionSlug);
    if (!regionInfo) return NextResponse.json({ message: "Choose a valid craft region." }, { status: 400 });
    const slug = slugify(title);
    const [category, region] = await Promise.all([
      prisma.category.upsert({ where: { slug: categoryInfo.slug }, update: {}, create: { name: categoryInfo.name, slug: categoryInfo.slug, description: categoryInfo.description, image: categoryInfo.image } }),
      prisma.region.upsert({ where: { slug: regionInfo.slug }, update: {}, create: { name: regionInfo.name, slug: regionInfo.slug, state: regionInfo.state, culturalStory: regionInfo.story, craftForm: regionInfo.craft, bannerImage: regionInfo.image } }),
    ]);
    const product = await prisma.product.create({ data: {
      title, slug, sku, categoryId: category.id, regionId: region.id,
      shortDesc: optionalText(body.shortDesc, 500), description: optionalText(body.description, 5000) || title,
      culturalStory: optionalText(body.culturalStory, 5000), fabricDetails: optionalText(body.fabricDetails, 1000),
      careInstructions: optionalText(body.careInstructions, 1000), price, mrp, costPrice: finiteOptionalNumber(body.costPrice),
      discount: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null,
      stock, lowStockAlert: 3, status: "ACTIVE", isFeatured: Boolean(body.isFeatured), isBestSeller: Boolean(body.isBestSeller),
      images: { create: { url: imageUrl, altText: title, isPrimary: true, orderIndex: 0 } },
    }, include: catalogProductInclude });
    return NextResponse.json({ product: { ...toProductItem(product), status: product.status } }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ message: "That product title or SKU is already in use. Choose a unique title and SKU." }, { status: 409 });
    console.error("Admin product creation failed:", error);
    return NextResponse.json({ message: "Could not save the product." }, { status: 503 });
  }
}

function isAllowedImageUrl(value: string) {
  if (/^\/api\/storage\/products\/[A-Za-z0-9._/-]+$/.test(value)) return !value.split("/").some((part) => part === ".." || part === ".");
  try { const url = new URL(value); return url.protocol === "https:" && ["images.unsplash.com", "res.cloudinary.com", "lh3.googleusercontent.com", "plus.unsplash.com"].includes(url.hostname); }
  catch { return false; }
}

function optionalText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) || null : null;
}

function finiteOptionalNumber(value: unknown) {
  const number = Number(value);
  return value !== undefined && value !== null && value !== "" && Number.isFinite(number) && number >= 0 ? number : null;
}

export async function DELETE(request: Request) {
  if (!await getAdminUser()) return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  try {
    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId : "";
    if (!productId) return NextResponse.json({ message: "Product ID is required." }, { status: 400 });
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
    const archived = await prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED" }, select: { id: true, status: true } });
    return NextResponse.json({ product: archived });
  } catch (error) {
    console.error("Admin product archive failed:", error);
    return NextResponse.json({ message: "Could not archive the product." }, { status: 503 });
  }
}
