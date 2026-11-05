import crypto from "crypto";

type GatewayOrder = { id: string; amount: number | string; currency: string };
type GatewayPayment = { id: string; order_id: string; amount: number | string; currency: string; status: string };

export function verifyRazorpayHmac(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  if (!orderId || !paymentId || !signature || !secret || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!rawBody || !secret || !signature || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function webhookEventDisposition(existing: { payloadHash: string; status: string } | null, payloadHash: string) {
  if (!existing) return "new" as const;
  if (existing.payloadHash !== payloadHash) return "identity-conflict" as const;
  if (existing.status === "PROCESSED" || existing.status === "IGNORED" || existing.status === "RECOVERY_REQUIRED") return "duplicate" as const;
  return "retry" as const;
}

export type WebhookClaimState = { status: string; claimToken: string | null; lockUntil: Date | null };

export function createWebhookClaim(token: string, now: Date, leaseMs = 120_000) {
  return { claimToken: token, lockUntil: new Date(now.getTime() + leaseMs) };
}

export function webhookClaimEligibilityWhere(now: Date) {
  return { OR: [
    { status: { in: ["RECEIVED", "RETRY"] } },
    { status: "PROCESSING", lockUntil: { lte: now } },
  ] };
}

export function webhookClaimCompletionWhere(id: string, token: string, now: Date) {
  return { id, status: "PROCESSING", claimToken: token, lockUntil: { gt: now } };
}

export function webhookClaimIsCurrent(state: WebhookClaimState, token: string, now: Date): boolean {
  return state.status === "PROCESSING" && state.claimToken === token &&
    state.lockUntil instanceof Date && state.lockUntil.getTime() > now.getTime();
}

export function completeWebhookClaimState<T extends Record<string, unknown>>(
  state: WebhookClaimState & T,
  token: string,
  now: Date,
  result: Partial<T> & { status: string },
): (WebhookClaimState & T) | null {
  if (!webhookClaimIsCurrent(state, token, now)) return null;
  return { ...state, ...result, claimToken: null, lockUntil: null };
}

export function paymentWebhookAction(eventType: string, currentPaymentStatus: string): "finalize" | "record-failure" | "no-op" {
  if (currentPaymentStatus === "captured") return "finalize";
  if (eventType === "payment.failed" && currentPaymentStatus === "failed") return "record-failure";
  return "no-op";
}

export function checkoutFailureDisposition(code: string): "recovery-required" | "retry" {
  return ["STOCK_CONFLICT", "PRODUCT_UNAVAILABLE", "VARIANT_UNAVAILABLE", "COUPON_INELIGIBLE", "COUPON_CUSTOMER_LIMIT", "COUPON_FIRST_ORDER_ONLY", "COUPON_UNAVAILABLE", "AMOUNT_CHANGED", "CUSTOMER_INACTIVE", "PAYMENT_MISMATCH", "PAYMENT_ID_CONFLICT", "INTENT_NOT_FOUND", "INVALID_SNAPSHOT", "PRICE_INVALID", "FINALIZED_ORDER_MISSING"].includes(code)
    ? "recovery-required"
    : "retry";
}

export function finalizedCheckoutDisposition(status: string, orderId: string | null): "continue" | "replay" | "manual-review" {
  if (status !== "FINALIZED") return "continue";
  return orderId ? "replay" : "manual-review";
}

export function checkoutPricingMatches(
  saved: { subtotal: number; discountAmount: number; shippingCharge: number; giftWrapCharge: number; totalAmount: number },
  current: { subtotal: number; discountAmount: number; shippingCharge: number; giftWrapCharge: number; totalAmount: number },
): boolean {
  const keys = ["subtotal", "discountAmount", "shippingCharge", "giftWrapCharge", "totalAmount"] as const;
  return keys.every((key) => {
    const savedValue = Number(saved?.[key]);
    const currentValue = Number(current?.[key]);
    return Number.isFinite(savedValue) && Number.isFinite(currentValue) && Math.round(savedValue * 100) === Math.round(currentValue * 100);
  });
}

export function isVerifiedPaymentIdConflict(error: any, checkoutId: string, paymentOwnerCheckoutId: string | null): boolean {
  // The write being guarded only assigns razorpayPaymentId. Confirm a different
  // owner as well as P2002 so unrelated unique errors are never made permanent.
  return error?.code === "P2002" && Boolean(paymentOwnerCheckoutId) && paymentOwnerCheckoutId !== checkoutId;
}

export function isCapturedPaymentForOrder(order: GatewayOrder, payment: GatewayPayment): boolean {
  return Boolean(order.id && payment.id && payment.order_id === order.id && payment.status === "captured" &&
    order.currency === "INR" && payment.currency === "INR" && Number.isInteger(Number(order.amount)) &&
    Number(order.amount) > 0 && Number(payment.amount) === Number(order.amount));
}

export function paymentReplayMatches(
  existing: { razorpayOrderId: string | null; razorpayPaymentId: string | null } | null,
  submitted: { orderId: string; paymentId: string },
): "same" | "conflict" | "new" {
  if (!existing) return "new";
  return existing.razorpayOrderId === submitted.orderId && existing.razorpayPaymentId === submitted.paymentId
    ? "same"
    : "conflict";
}
