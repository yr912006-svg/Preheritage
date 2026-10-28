import { isAllowedProductImageUrl } from "@/lib/catalog-admin";

export const TAXONOMY_KINDS = ["category", "subcategory", "collection", "region"] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

export function slugFromName(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function stringValue(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalText(value: unknown, max: number) {
  return stringValue(value, max) || null;
}

export function normalizeTaxonomyInput(input: unknown, kind: TaxonomyKind) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false as const, message: "Catalogue details are required." };
  const body = input as Record<string, unknown>;
  const name = stringValue(body.name, 120);
  const slug = slugFromName(stringValue(body.slug, 120) || name);
  const image = optionalText(body.image, 2048);
  const bannerImage = optionalText(body.bannerImage, 2048);
  const urls = [image, bannerImage].filter((url): url is string => Boolean(url));
  if (name.length < 2 || !slug || urls.some((url) => !isAllowedProductImageUrl(url))) return { ok: false as const, message: "Check the name, URL-safe slug, and image URLs." };

  const shared = { name, slug };
  if (kind === "category") {
    const orderIndex = body.orderIndex === undefined ? 0 : Number(body.orderIndex);
    if (!Number.isInteger(orderIndex) || orderIndex < 0 || orderIndex > 100000) return { ok: false as const, message: "Choose a valid display order." };
    return { ok: true as const, data: { ...shared, description: optionalText(body.description, 2000), image, featured: body.featured === true, orderIndex } };
  }
  if (kind === "subcategory") {
    const categoryId = stringValue(body.categoryId, 100);
    if (!categoryId) return { ok: false as const, message: "Choose a parent category." };
    return { ok: true as const, data: { ...shared, categoryId, description: optionalText(body.description, 2000), image } };
  }
  if (kind === "collection") {
    return { ok: true as const, data: { ...shared, tagline: optionalText(body.tagline, 240), description: optionalText(body.description, 2000), bannerImage, featured: body.featured === true } };
  }
  const state = stringValue(body.state, 120);
  const craftForm = stringValue(body.craftForm, 240);
  const culturalStory = stringValue(body.culturalStory, 5000);
  if (state.length < 2 || craftForm.length < 2 || culturalStory.length < 10) return { ok: false as const, message: "Region state, craft form, and story are required." };
  return { ok: true as const, data: { ...shared, state, craftForm, culturalStory, bannerImage, featured: body.featured === true } };
}
