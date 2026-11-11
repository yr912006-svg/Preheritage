import { createHash } from "node:crypto";

export type CheckoutIdentity = { userId: string | null; email: string };
export type ExistingIdempotentOrder = { userId: string | null; guestEmail: string | null; checkoutRequestFingerprint: string | null };

export function isCheckoutIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value);
}

function canonicalize(value: any): any {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().flatMap((key) =>
      value[key] === undefined ? [] : [[key, canonicalize(value[key])]],
    ));
  }
  return value;
}

export function checkoutRequestFingerprint(input: {
  customer: Record<string, unknown>;
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>;
  deliveryMethod: string;
  giftWrap: boolean;
  couponCode?: string | null;
  giftMessage?: unknown;
  orderNotes?: unknown;
}): string {
  const canonicalItems = input.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId ?? null,
    quantity: item.quantity,
  })).sort((left, right) =>
    left.productId.localeCompare(right.productId) || String(left.variantId ?? "").localeCompare(String(right.variantId ?? "")),
  );
  const request = canonicalize({
    paymentMethod: "COD",
    customer: input.customer,
    items: canonicalItems,
    deliveryMethod: input.deliveryMethod,
    giftWrap: input.giftWrap,
    couponCode: input.couponCode?.trim().toUpperCase() || null,
    giftMessage: input.giftMessage ?? null,
    orderNotes: input.orderNotes ?? null,
  });
  return createHash("sha256").update(JSON.stringify(request), "utf8").digest("hex");
}

export function checkoutIdempotencyDisposition(
  existing: ExistingIdempotentOrder | null,
  identity: CheckoutIdentity,
  fingerprint: string,
): "new" | "replay" | "conflict" {
  if (!existing) return "new";
  const sameIdentity = identity.userId
    ? existing.userId === identity.userId
    : existing.userId === null && existing.guestEmail?.trim().toLowerCase() === identity.email.trim().toLowerCase();
  return sameIdentity && existing.checkoutRequestFingerprint === fingerprint ? "replay" : "conflict";
}
