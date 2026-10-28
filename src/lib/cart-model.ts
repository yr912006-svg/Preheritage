import type { ProductItem } from "@/lib/sample-data";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
  isSavedForLater?: boolean;
}

export interface CartCoupon {
  code: string;
  discount: number;
  type: "PERCENT" | "FIXED";
  minimumOrderValue?: number;
  maxDiscount?: number;
}

export function normalizeCartCoupon(value: unknown): CartCoupon | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<CartCoupon>;
  const code = typeof source.code === "string" ? source.code.trim().toUpperCase() : "";
  const discount = Number(source.discount);
  if (!code || !Number.isFinite(discount) || discount <= 0 || (source.type !== "PERCENT" && source.type !== "FIXED")) return null;
  const minimumOrderValue = Number(source.minimumOrderValue ?? 0);
  const maxDiscount = source.maxDiscount == null ? undefined : Number(source.maxDiscount);
  return {
    code,
    discount,
    type: source.type,
    minimumOrderValue: Number.isFinite(minimumOrderValue) && minimumOrderValue >= 0 ? minimumOrderValue : 0,
    maxDiscount: maxDiscount !== undefined && Number.isFinite(maxDiscount) && maxDiscount >= 0 ? maxDiscount : undefined,
  };
}

export function normalizeCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<CartItem>;
  const productId = typeof source.productId === "string" ? source.productId.trim() : "";
  const price = Number(source.price);
  const quantity = Number(source.quantity);
  const stock = Number(source.maxStock);
  if (!productId || !Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 20 || !Number.isInteger(stock) || stock < 1) return null;

  const size = typeof source.size === "string" && source.size ? source.size : "Standard";
  const color = typeof source.color === "string" && source.color ? source.color : "Original";
  const id = typeof source.id === "string" && source.id ? source.id : `${productId}-${size}-${color}`;
  const mrp = Number(source.mrp);
  return {
    id,
    productId,
    variantId: typeof source.variantId === "string" && source.variantId ? source.variantId : undefined,
    title: typeof source.title === "string" ? source.title : "PREHERITAGE product",
    slug: typeof source.slug === "string" ? source.slug : "",
    price,
    mrp: Number.isFinite(mrp) && mrp >= price ? mrp : price,
    image: typeof source.image === "string" ? source.image : "",
    size,
    color,
    quantity: Math.min(quantity, stock),
    maxStock: stock,
    isSavedForLater: source.isSavedForLater === true,
  };
}

export function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeCartItem).filter((item): item is CartItem => item !== null);
}

export function createCartItem(
  product: ProductItem,
  size?: string,
  color?: string,
  requestedQuantity = 1
): { item: CartItem | null; message?: string } {
  if (product.status && product.status !== "ACTIVE") {
    return { item: null, message: "This product is currently unavailable." };
  }
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    return { item: null, message: "Choose a valid quantity." };
  }

  const chosenSize = size || product.sizes[0] || "Standard";
  const chosenColor = color || product.colors[0]?.name || "Original";
  const variants = product.variants || [];
  const variant = variants.find((entry) => entry.size === chosenSize && entry.color === chosenColor);
  if (variants.length > 0 && !variant) {
    return { item: null, message: "That size and color combination is unavailable." };
  }

  const maxStock = variant ? variant.stock : product.stock;
  if (!Number.isInteger(maxStock) || maxStock < 1 || variant?.isActive === false) {
    return { item: null, message: "This selection is currently out of stock." };
  }

  const price = Number(product.price) + Number(variant?.additionalPrice || 0);
  if (!Number.isFinite(price) || price <= 0) {
    return { item: null, message: "This product price could not be verified." };
  }

  return {
    item: {
      id: `${product.id}-${chosenSize}-${chosenColor}`,
      productId: product.id,
      variantId: variant?.id,
      title: product.title,
      slug: product.slug,
      price,
      mrp: product.mrp,
      image: product.images[0] || "",
      size: chosenSize,
      color: chosenColor,
      quantity: Math.min(requestedQuantity, maxStock, 20),
      maxStock,
    },
  };
}

export function mergeCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const current = normalizeCartItems(items);
  const existing = current.find((entry) => entry.id === item.id);
  if (!existing) return [...current, item];
  return current.map((entry) => entry.id === item.id
    ? { ...entry, quantity: Math.min(entry.quantity + item.quantity, entry.maxStock, 20) }
    : entry);
}

export function setCartItemQuantity(items: CartItem[], itemId: string, quantity: number): CartItem[] {
  if (!Number.isInteger(quantity)) return normalizeCartItems(items);
  if (quantity <= 0) return normalizeCartItems(items).filter((item) => item.id !== itemId);
  return normalizeCartItems(items).map((item) => item.id === itemId
    ? { ...item, quantity: Math.min(quantity, item.maxStock, 20) }
    : item);
}

export function removeCartItem(items: CartItem[], itemId: string): CartItem[] {
  return normalizeCartItems(items).filter((item) => item.id !== itemId);
}

export function calculateCartSubtotal(items: CartItem[]): number {
  return normalizeCartItems(items).reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function normalizeCheckoutItems(value: unknown): { items: { productId: string; variantId: string | null; quantity: number }[]; error?: string } {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) return { items: [], error: "Your bag is empty or contains an invalid number of items." };
  const normalized: { productId: string; variantId: string | null; quantity: number }[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return { items: [], error: "One or more cart items are invalid." };
    const item = entry as { productId?: unknown; variantId?: unknown; quantity?: unknown };
    const productId = typeof item.productId === "string" ? item.productId.trim() : "";
    const variantId = typeof item.variantId === "string" && item.variantId ? item.variantId : null;
    const quantity = Number(item.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return { items: [], error: "One or more cart items are invalid." };
    const existing = normalized.find((line) => line.productId === productId && line.variantId === variantId);
    if (existing) {
      if (existing.quantity + quantity > 20) return { items: [], error: "A cart item exceeds the allowed quantity." };
      existing.quantity += quantity;
    } else {
      normalized.push({ productId, variantId, quantity });
    }
  }
  return { items: normalized };
}

export function calculateShippingCharge(subtotal: number, deliveryMethod: "standard" | "express" = "standard"): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  if (deliveryMethod === "express") return 499;
  return subtotal >= 4999 ? 0 : 250;
}

export function calculateCouponDiscount(coupon: CartCoupon | null, subtotal: number): number {
  if (!coupon || !Number.isFinite(subtotal) || subtotal < (coupon.minimumOrderValue || 0)) return 0;
  const amount = coupon.type === "PERCENT"
    ? Math.round(subtotal * coupon.discount / 100)
    : Math.round(coupon.discount);
  return Math.min(amount, coupon.maxDiscount ?? amount, subtotal);
}

export function calculateCheckoutTotal(input: {
  subtotal: number;
  discountAmount?: number;
  shippingCharge?: number;
  giftWrapCharge?: number;
  codFee?: number;
}): number {
  const values = [input.subtotal, input.discountAmount || 0, input.shippingCharge || 0, input.giftWrapCharge || 0, input.codFee || 0];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return 0;
  return Math.max(0, input.subtotal - (input.discountAmount || 0) + (input.shippingCharge || 0) + (input.giftWrapCharge || 0) + (input.codFee || 0));
}
