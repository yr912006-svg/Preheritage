import prisma from "@/lib/prisma";
import { CATEGORIES } from "@/lib/sample-data";
import { isAllowedProductImageUrl } from "@/lib/catalog-admin";

export const TAXONOMY_KINDS = ["category", "subcategory", "collection", "region"] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

export const DEFAULT_SUBCATEGORIES: Record<string, { name: string; slug: string }[]> = {
  sarees: [
    { name: "Banarasi Katan Silk", slug: "banarasi-katan-silk" },
    { name: "Kanjeevaram Silk", slug: "kanjeevaram-silk" },
    { name: "Chanderi & Maheshwari", slug: "chanderi-maheshwari" },
    { name: "Jamdani Muslin", slug: "jamdani-muslin" },
    { name: "Patola & Bandhani", slug: "patola-bandhani" },
  ],
  kurtas: [
    { name: "Chanderi Silk Kurtas", slug: "chanderi-silk-kurtas" },
    { name: "Awadhi Angrakhas", slug: "awadhi-angrakhas" },
    { name: "Handspun Khadi Tunics", slug: "handspun-khadi-tunics" },
    { name: "Short Silk Tunics", slug: "short-silk-tunics" },
  ],
  lehengas: [
    { name: "Bridal Zardozi Lehengas", slug: "bridal-zardozi-lehengas" },
    { name: "Royal Gota Patti Sets", slug: "royal-gota-patti-sets" },
    { name: "Banarasi Brocade Lehengas", slug: "banarasi-brocade-lehengas" },
    { name: "Velvet Ceremonial Lehengas", slug: "velvet-ceremonial-lehengas" },
  ],
  "mens-ethnic-wear": [
    { name: "Royal Sherwanis & Achkans", slug: "royal-sherwanis-achkans" },
    { name: "Handcrafted Kurta Sets", slug: "handcrafted-kurta-sets" },
    { name: "Tailored Nehru Jackets", slug: "tailored-nehru-jackets" },
    { name: "Bandhgala Jackets", slug: "bandhgala-jackets" },
  ],
  handloom: [
    { name: "GI-Tagged Master Weaves", slug: "gi-tagged-master-weaves" },
    { name: "Khadi & Organic Cottons", slug: "khadi-organic-cottons" },
    { name: "Ikat & Telia Rumal", slug: "ikat-telia-rumal" },
    { name: "Tussar & Muga Silks", slug: "tussar-muga-silks" },
  ],
  handicrafts: [
    { name: "Brass & Dhokra Sculptures", slug: "brass-dhokra-sculptures" },
    { name: "Marble Inlay Artifacts", slug: "marble-inlay-artifacts" },
    { name: "Wooden Heirlooms & Boxes", slug: "wooden-heirlooms-boxes" },
    { name: "Silver Filigree", slug: "silver-filigree" },
  ],
  posters: [
    { name: "Architectural Heritage Prints", slug: "architectural-heritage-prints" },
    { name: "Mughal Botanical Lithographs", slug: "mughal-botanical-lithographs" },
    { name: "Vintage Palace Monochromes", slug: "vintage-palace-monochromes" },
  ],
  accessories: [
    { name: "Kashmiri Pashmina Shawls", slug: "kashmiri-pashmina-shawls" },
    { name: "Hand-Embroidered Stoles", slug: "hand-embroidered-stoles" },
    { name: "Potlis & Batwas", slug: "potlis-batwas" },
    { name: "Heritage Jewelry & Brooches", slug: "heritage-jewelry-brooches" },
  ],
};

let defaultTaxonomyEnsured = false;

export async function ensureDefaultTaxonomy() {
  if (defaultTaxonomyEnsured) return;
  try {
    const existing = await prisma.category.findMany({ select: { id: true, slug: true } });
    const existingSlugs = new Map(existing.map((c) => [c.slug, c.id]));

    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i];
      if (!existingSlugs.has(cat.slug)) {
        const created = await prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image: cat.image,
            orderIndex: i,
          },
        });
        existingSlugs.set(cat.slug, created.id);
      }
    }

    for (const [categorySlug, subcats] of Object.entries(DEFAULT_SUBCATEGORIES)) {
      const categoryId = existingSlugs.get(categorySlug);
      if (!categoryId) continue;
      const count = await prisma.subcategory.count({ where: { categoryId } });
      if (count === 0) {
        for (const sub of subcats) {
          await prisma.subcategory.upsert({
            where: { slug: sub.slug },
            update: {},
            create: {
              name: sub.name,
              slug: sub.slug,
              categoryId,
            },
          });
        }
      }
    }
    defaultTaxonomyEnsured = true;
  } catch (error) {
    console.error("Failed to ensure default taxonomy:", error);
  }
}

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
