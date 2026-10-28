export interface InventoryVariant {
  id?: string;
  stock: number;
  isActive?: boolean;
}

export interface InventoryProduct {
  stock: number;
  status?: string;
  variants?: InventoryVariant[];
}

export function applyStockDelta(current: number, delta: number, maximum = 100000) {
  if (!Number.isInteger(current) || current < 0 || current > maximum || !Number.isInteger(delta) || Math.abs(delta) !== 1) return null;
  const next = current + delta;
  return next >= 0 && next <= maximum ? next : null;
}

export function getSellableStock(product: InventoryProduct): number {
  if (product.status && product.status !== "ACTIVE") return 0;
  if (product.variants?.length) {
    return product.variants.reduce((total, variant) => {
      if (variant.isActive === false || !Number.isInteger(variant.stock) || variant.stock < 0) return total;
      return total + variant.stock;
    }, 0);
  }
  return Number.isInteger(product.stock) && product.stock > 0 ? product.stock : 0;
}

export function isVariantAvailable(product: InventoryProduct, variantId: string | undefined): boolean {
  if (product.status && product.status !== "ACTIVE") return false;
  if (!product.variants?.length) return !variantId && getSellableStock(product) > 0;
  if (!variantId) return false;
  const variant = product.variants.find((entry) => entry.id === variantId);
  return Boolean(variant && variant.isActive !== false && Number.isInteger(variant.stock) && variant.stock > 0);
}
