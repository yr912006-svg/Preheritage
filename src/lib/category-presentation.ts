import type { StorefrontCategory } from "@/lib/catalog";

export function mergeStorefrontCategories(
  databaseCategories: StorefrontCategory[],
  fallbackCategories: StorefrontCategory[],
): StorefrontCategory[] {
  const presentSlugs = new Set(databaseCategories.map((category) => category.slug));
  const missingCategories = fallbackCategories.filter((category) => !presentSlugs.has(category.slug));
  const nextOrderIndex = databaseCategories.length
    ? Math.max(...databaseCategories.map((category) => category.orderIndex)) + 1
    : 0;

  return [
    ...databaseCategories,
    ...missingCategories.map((category, index) => ({
      ...category,
      orderIndex: nextOrderIndex + index,
    })),
  ];
}

export function getStorefrontCategoryImage(
  image: string | null,
  slug: string,
  fallbackCategories: { slug: string; image: string }[],
): string | null {
  if (image?.trim()) return image;
  return fallbackCategories.find((category) => category.slug === slug)?.image ?? null;
}

export function getStorefrontCategoryCountLabel(
  productCounts: Record<string, number> | null,
  slug: string,
): string {
  const count = productCounts?.[slug];
  return typeof count === "number" ? `${count} Handcrafted Items` : "Catalog count unavailable";
}
