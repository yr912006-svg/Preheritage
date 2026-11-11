import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type CheckoutPriceLine = { productId: string; variantId: string | null; title: string; quantity: number; price: number };
export type CheckoutPricing = {
  items: CheckoutPriceLine[];
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  giftWrapCharge: number;
  codFee: number;
  totalAmount: number;
};

export type CheckoutExpectedPricing = Partial<Omit<CheckoutPricing, "items">> & {
  items?: Array<{ productId?: unknown; variantId?: unknown; quantity?: unknown; price?: unknown }>;
};

export const CHECKOUT_CONFIRMATION_MAX_AGE_MS = 15 * 60 * 1000;

function confirmationSigningKey(secret: string): Buffer {
  return createHmac("sha256", secret).update("preheritage:checkout-confirmation:v1", "utf8").digest();
}

export type CheckoutAvailability = {
  code: "ITEM_UNAVAILABLE" | "STOCK_CONFLICT";
  message: string;
};

export function checkoutAvailabilityConflict(input: {
  title: string;
  productActive: boolean;
  hasVariants: boolean;
  selectedVariantExists: boolean;
  availableStock: number;
  requestedQuantity: number;
}): CheckoutAvailability | null {
  if (!input.productActive) return { code: "ITEM_UNAVAILABLE", message: `${input.title} is no longer available. Remove it from your bag to continue.` };
  if (input.hasVariants && !input.selectedVariantExists) return { code: "ITEM_UNAVAILABLE", message: `The selected option for ${input.title} is no longer available. Remove it from your bag and try again.` };
  if (input.availableStock < input.requestedQuantity) {
    return { code: "STOCK_CONFLICT", message: input.availableStock > 0
      ? `Only ${input.availableStock} of ${input.title} remain. Update the quantity in your bag and try again.`
      : `The selected option for ${input.title} is unavailable or out of stock. Update your bag and try again.` };
  }
  return null;
}

export function checkoutProductStockGuard<TPrice>(input: { productId: string; price: TPrice; quantity: number }) {
  return { id: input.productId, status: "ACTIVE" as const, price: input.price, stock: { gte: input.quantity } };
}

export function checkoutVariantStockGuard<TPrice, TVariantPrice>(input: { variantId: string; productPrice: TPrice; additionalPrice: TVariantPrice; quantity: number }) {
  return {
    id: input.variantId,
    additionalPrice: input.additionalPrice,
    stock: { gte: input.quantity },
    product: { is: { status: "ACTIVE" as const, price: input.productPrice } },
  };
}

export function checkoutPricingFingerprint(pricing: CheckoutPricing, context: { couponCode?: string | null; deliveryMethod?: string; customerIdentity?: string; checkoutIdempotencyKey?: string } = {}): string {
  const canonical = {
    items: pricing.items.map(({ productId, variantId, quantity, price }) => ({ productId, variantId, quantity, price }))
      .sort((a, b) => a.productId.localeCompare(b.productId) || String(a.variantId ?? "").localeCompare(String(b.variantId ?? ""))),
    subtotal: pricing.subtotal,
    discountAmount: pricing.discountAmount,
    shippingCharge: pricing.shippingCharge,
    giftWrapCharge: pricing.giftWrapCharge,
    codFee: pricing.codFee,
    totalAmount: pricing.totalAmount,
    context: {
      couponCode: context.couponCode?.trim().toUpperCase() || null,
      deliveryMethod: context.deliveryMethod ?? null,
      customerIdentity: context.customerIdentity?.trim().toLowerCase() || null,
      checkoutIdempotencyKey: context.checkoutIdempotencyKey ?? null,
    },
  };
  return createHash("sha256").update(JSON.stringify(canonical), "utf8").digest("hex");
}

function matchesExpected(expected: CheckoutExpectedPricing | null | undefined, current: CheckoutPricing): boolean {
  if (!expected) return false;
  const expectedItems = Array.isArray(expected.items) ? expected.items : [];
  const pricesMatch = current.items.length === expectedItems.length && current.items.every((item) => {
    const expectedItem = expectedItems.find((line) => line.productId === item.productId && (line.variantId ?? null) === item.variantId);
    return expectedItem && expectedItem.quantity === item.quantity && typeof expectedItem.price === "number" && expectedItem.price === item.price;
  });
  return pricesMatch && expected.subtotal === current.subtotal && expected.discountAmount === current.discountAmount &&
    expected.shippingCharge === current.shippingCharge && expected.giftWrapCharge === current.giftWrapCharge &&
    expected.codFee === current.codFee && expected.totalAmount === current.totalAmount;
}

type CheckoutConfirmationContext = { couponCode?: string | null; deliveryMethod?: string; customerIdentity?: string; checkoutIdempotencyKey: string };

function quoteDigest(pricing: CheckoutPricing, context: CheckoutConfirmationContext): string {
  return checkoutPricingFingerprint(pricing, context);
}

export function createCheckoutConfirmationToken(input: {
  pricing: CheckoutPricing;
  context: CheckoutConfirmationContext;
  secret: string;
  now?: number;
}): string {
  const payload = Buffer.from(JSON.stringify({ digest: quoteDigest(input.pricing, input.context), issuedAt: input.now ?? Date.now() }), "utf8").toString("base64url");
  const signature = createHmac("sha256", confirmationSigningKey(input.secret)).update(payload, "utf8").digest("base64url");
  return `${payload}.${signature}`;
}

export function isCheckoutConfirmationTokenValid(input: {
  token: unknown;
  pricing: CheckoutPricing;
  context: CheckoutConfirmationContext;
  secret: string;
  now?: number;
  maxAgeMs?: number;
}): boolean {
  if (typeof input.token !== "string" || input.token.length > 4096 || !input.secret) return false;
  const [payload, signature, extra] = input.token.split(".");
  if (!payload || !signature || extra !== undefined) return false;
  const expectedSignature = createHmac("sha256", confirmationSigningKey(input.secret)).update(payload, "utf8").digest();
  let actualSignature: Buffer;
  try { actualSignature = Buffer.from(signature, "base64url"); } catch { return false; }
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return false;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded || typeof decoded !== "object") return false;
    const issuedAt = (decoded as { issuedAt?: unknown }).issuedAt;
    const digest = (decoded as { digest?: unknown }).digest;
    const now = input.now ?? Date.now();
    if (typeof issuedAt !== "number" || !Number.isSafeInteger(issuedAt) || issuedAt > now + 30_000 || now - issuedAt > (input.maxAgeMs ?? CHECKOUT_CONFIRMATION_MAX_AGE_MS)) return false;
    return digest === quoteDigest(input.pricing, input.context);
  } catch {
    return false;
  }
}

export function checkoutNeedsPriceConfirmation(input: {
  expected: CheckoutExpectedPricing | null | undefined;
  confirmationToken: unknown;
  current: CheckoutPricing;
  context: CheckoutConfirmationContext;
  secret: string;
  now?: number;
}): boolean {
  if (input.confirmationToken !== undefined && input.confirmationToken !== null) {
    return !isCheckoutConfirmationTokenValid({
      token: input.confirmationToken, pricing: input.current, context: input.context, secret: input.secret, now: input.now,
    });
  }
  return !matchesExpected(input.expected, input.current);
}

export class CheckoutStockConflict extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutStockConflict";
  }
}

export class CheckoutPriceRaceConflict extends Error {
  constructor() {
    super("Prices changed while checkout was being placed. Review the latest order summary and try again.");
    this.name = "CheckoutPriceRaceConflict";
  }
}
