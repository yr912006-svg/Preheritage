export type ProductVariantInput = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  colorCode: string | null;
  stock: number;
  additionalPrice: number;
};
export type ProductImageInput = { url: string; altText: string | null };

export type ProductInput = {
  title: string;
  sku: string;
  categoryId: string;
  subcategoryId: string | null;
  collectionId: string | null;
  regionId: string | null;
  shortDesc: string | null;
  description: string;
  culturalStory: string | null;
  fabricDetails: string | null;
  careInstructions: string | null;
  sizeFitGuide: string | null;
  price: number;
  mrp: number;
  costPrice: number | null;
  stock: number;
  lowStockAlert: number;
  status: "ACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "ARCHIVED";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isSale: boolean;
  isLimitedEdition: boolean;
  videoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ProductImageInput[];
  primaryImageIndex: number;
  variants: ProductVariantInput[];
};

export type ProductInputResult = { ok: true; value: ProductInput } | { ok: false; message: string };
export type ExistingVariantReference = { id: string; orderItemCount: number; cartItemCount: number };

export function planVariantReplacement(existing: ExistingVariantReference[], submitted: Pick<ProductVariantInput, "id">[]) {
  const existingIds = new Set(existing.map((variant) => variant.id));
  const submittedIds = submitted.flatMap((variant) => variant.id ? [variant.id] : []);
  if (submittedIds.some((id) => !existingIds.has(id)) || new Set(submittedIds).size !== submittedIds.length) return { ok: false as const, reason: "INVALID_VARIANT_ID" as const, removeIds: [] as string[] };
  const keep = new Set(submittedIds);
  const removed = existing.filter((variant) => !keep.has(variant.id));
  if (removed.some((variant) => variant.orderItemCount > 0 || variant.cartItemCount > 0)) return { ok: false as const, reason: "VARIANT_IN_USE" as const, removeIds: [] as string[] };
  return { ok: true as const, removeIds: removed.map((variant) => variant.id) };
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalText(value: unknown, max: number) {
  return text(value, max) || null;
}

function numberValue(value: unknown) {
  if (value === "" || value === null || value === undefined) return Number.NaN;
  return Number(value);
}

export function isAllowedProductImageUrl(value: string) {
  if (/^\/api\/storage\/products\/[A-Za-z0-9._/-]+$/.test(value)) return !value.split("/").some((part) => part === ".." || part === ".");
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["images.unsplash.com", "res.cloudinary.com", "lh3.googleusercontent.com", "plus.unsplash.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeProductInput(input: unknown): ProductInputResult {
  const body = input as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, message: "Product details are required." };

  const title = text(body.title, 180);
  const sku = text(body.sku, 50).toUpperCase();
  const categoryId = text(body.categoryId, 100);
  const description = text(body.description, 5000);
  const price = numberValue(body.price);
  const mrp = numberValue(body.mrp);
  const stock = numberValue(body.stock);
  const lowStockAlert = numberValue(body.lowStockAlert);
  const costPrice = body.costPrice === undefined || body.costPrice === null || body.costPrice === "" ? null : numberValue(body.costPrice);
  const images: ProductImageInput[] = Array.isArray(body.images) ? body.images.map((image) => {
    if (typeof image === "string") return { url: text(image, 2048), altText: null };
    if (image && typeof image === "object" && !Array.isArray(image)) {
      const entry = image as Record<string, unknown>;
      return { url: text(entry.url, 2048), altText: optionalText(entry.altText, 240) };
    }
    return { url: "", altText: null };
  }) : [];
  const primaryImageIndex = body.primaryImageIndex === undefined ? 0 : numberValue(body.primaryImageIndex);

  const rawVariants = body.variants === undefined ? [] : body.variants;
  if (!Array.isArray(rawVariants) || rawVariants.length > 100) return { ok: false, message: "Choose no more than 100 variants." };
  const variants: ProductVariantInput[] = [];
  for (const raw of rawVariants) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, message: "Check the product variants." };
    const variant = raw as Record<string, unknown>;
    const variantSku = text(variant.sku, 50).toUpperCase();
    const size = text(variant.size, 24);
    const color = text(variant.color, 48);
    const variantStock = numberValue(variant.stock);
    const additionalPrice = variant.additionalPrice === undefined ? 0 : numberValue(variant.additionalPrice);
    const colorCode = optionalText(variant.colorCode, 7);
    const id = optionalText(variant.id, 100) || undefined;
    if (!/^[A-Z0-9_-]{3,50}$/.test(variantSku) || !size || !color ||
        !Number.isInteger(variantStock) || variantStock < 0 || variantStock > 100000 ||
        !Number.isFinite(additionalPrice) || additionalPrice < 0 || additionalPrice > 10000000 ||
        (colorCode !== null && !/^#[0-9A-Fa-f]{6}$/.test(colorCode))) {
      return { ok: false, message: "Check each variant SKU, size, color, price adjustment, and stock value." };
    }
    variants.push({ id, sku: variantSku, size, color, colorCode, stock: variantStock, additionalPrice });
  }

  const variantSkus = variants.map((variant) => variant.sku.toLowerCase());
  const rawImages = images;
  if (title.length < 3 || !/^[A-Z0-9_-]{3,50}$/.test(sku) || !categoryId ||
      description.length < 10 || !Number.isFinite(price) || price <= 0 || price > 100000000 ||
      !Number.isFinite(mrp) || mrp < price || mrp > 100000000 ||
      (costPrice !== null && (!Number.isFinite(costPrice) || costPrice < 0 || costPrice > 100000000)) ||
      (!variants.length && (!Number.isInteger(stock) || stock < 0 || stock > 100000)) ||
      !Number.isInteger(lowStockAlert) || lowStockAlert < 0 || lowStockAlert > 100000 ||
      !Array.isArray(body.images) || rawImages.length < 1 || rawImages.length > 12 || rawImages.some(({ url }) => !isAllowedProductImageUrl(url)) ||
      !Number.isInteger(primaryImageIndex) || primaryImageIndex < 0 || primaryImageIndex >= rawImages.length ||
      new Set(variantSkus).size !== variantSkus.length) {
    return { ok: false, message: "Check the title, SKU, category, description, prices, stock, images, and variants." };
  }

  const status = body.status === undefined ? "ACTIVE" : body.status;
  if (status !== "ACTIVE" && status !== "DRAFT" && status !== "OUT_OF_STOCK" && status !== "ARCHIVED") return { ok: false, message: "Choose a valid product status." };

  return { ok: true, value: {
    title, sku, categoryId,
    subcategoryId: optionalText(body.subcategoryId, 100),
    collectionId: optionalText(body.collectionId, 100),
    regionId: optionalText(body.regionId, 100),
    shortDesc: optionalText(body.shortDesc, 500), description,
    culturalStory: optionalText(body.culturalStory, 5000), fabricDetails: optionalText(body.fabricDetails, 1000),
    careInstructions: optionalText(body.careInstructions, 1000), sizeFitGuide: optionalText(body.sizeFitGuide, 2000),
    price, mrp, costPrice,
    stock: variants.length ? 0 : stock, lowStockAlert, status,
    isFeatured: body.isFeatured === true, isNewArrival: body.isNewArrival === true,
    isBestSeller: body.isBestSeller === true, isSale: body.isSale === true,
    isLimitedEdition: body.isLimitedEdition === true,
    videoUrl: optionalText(body.videoUrl, 2048), seoTitle: optionalText(body.seoTitle, 180),
    seoDescription: optionalText(body.seoDescription, 1000),
    images: rawImages, primaryImageIndex, variants,
  } };
}
