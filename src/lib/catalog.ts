import type { Prisma } from "@prisma/client";
import type { ProductItem } from "@/lib/sample-data";
import { getSellableStock } from "@/lib/inventory";

export const catalogProductInclude = {
  category: true,
  subcategory: true,
  collection: true,
  region: true,
  images: { orderBy: [{ isPrimary: "desc" as const }, { orderIndex: "asc" as const }] },
  variants: { orderBy: [{ size: "asc" as const }, { color: "asc" as const }] },
  reviews: { where: { status: "APPROVED" as const }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

export type CatalogProduct = Prisma.ProductGetPayload<{ include: typeof catalogProductInclude }>;

export type StorefrontCategory = { id: string; name: string; slug: string; description: string | null; image: string | null; orderIndex: number };
export type StorefrontCollection = { id: string; name: string; slug: string; tagline: string | null; description: string | null; bannerImage: string | null };
export type StorefrontRegion = { id: string; name: string; slug: string; state: string; culturalStory: string; craftForm: string; bannerImage: string | null };

export function toProductItem(product: CatalogProduct): ProductItem {
  const sizes = Array.from(new Set(product.variants.map((variant) => variant.size)));
  const colors = Array.from(new Map(product.variants.map((variant) => [variant.color, {
    name: variant.color,
    hex: variant.colorCode || "#FAF7F2",
  }])).values());
  const reviewCount = product.reviews.length;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    sku: product.sku,
    createdAt: product.createdAt.toISOString(),
    category: product.category.slug,
    subcategory: product.subcategory?.slug || undefined,
    collection: product.collection?.slug || undefined,
    region: product.region?.slug || "",
    state: product.region?.state || "",
    price: product.price,
    mrp: product.mrp,
    discount: product.discount || undefined,
    rating: reviewCount ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 0,
    reviewCount,
    badge: product.isNewArrival ? "NEW" : product.isBestSeller ? "BESTSELLER" : product.isSale ? "SALE" : product.isLimitedEdition ? "LIMITED_EDITION" : undefined,
    images: product.images.map((image) => image.url),
    videoUrl: product.videoUrl || undefined,
    shortDesc: product.shortDesc || "",
    description: product.description,
    culturalStory: product.culturalStory || "",
    fabricDetails: product.fabricDetails || "",
    careInstructions: product.careInstructions || "",
    sizeFitGuide: product.sizeFitGuide || "",
    sizes: sizes.length ? sizes : ["Free Size"],
    colors: colors.length ? colors : [{ name: "Original", hex: "#FAF7F2" }],
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      colorCode: variant.colorCode || undefined,
      stock: variant.stock,
      additionalPrice: variant.additionalPrice,
    })),
    stock: getSellableStock({ stock: product.stock, status: product.status, variants: product.variants }),
    status: product.status,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
  };
}
