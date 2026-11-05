import test from "node:test";
import assert from "node:assert/strict";
import { checkoutFailureDisposition, checkoutPricingMatches, completeWebhookClaimState, createWebhookClaim, finalizedCheckoutDisposition, isCapturedPaymentForOrder, isVerifiedPaymentIdConflict, paymentReplayMatches, paymentWebhookAction, verifyRazorpayHmac, verifyRazorpayWebhookSignature, webhookClaimCompletionWhere, webhookClaimEligibilityWhere, webhookClaimIsCurrent, webhookEventDisposition } from "./payment-integrity.ts";
import { createHmac } from "node:crypto";

const order = { id: "order_1", amount: 12500, currency: "INR" };
const payment = { id: "pay_1", order_id: "order_1", amount: 12500, currency: "INR", status: "captured" };

test("accepts only captured payments linked to the matching INR order and amount", () => {
  assert.equal(isCapturedPaymentForOrder(order, payment), true);
  assert.equal(isCapturedPaymentForOrder(order, { ...payment, status: "failed" }), false);
  assert.equal(isCapturedPaymentForOrder(order, { ...payment, order_id: "order_other" }), false);
  assert.equal(isCapturedPaymentForOrder(order, { ...payment, amount: 1 }), false);
  assert.equal(isCapturedPaymentForOrder({ ...order, currency: "USD" }, payment), false);
});

test("repeated success callbacks are idempotent while a different payment for that order conflicts", () => {
  const recorded = { razorpayOrderId: "order_1", razorpayPaymentId: "pay_1" };
  assert.equal(paymentReplayMatches(recorded, { orderId: "order_1", paymentId: "pay_1" }), "same");
  assert.equal(paymentReplayMatches(recorded, { orderId: "order_1", paymentId: "pay_2" }), "conflict");
  assert.equal(paymentReplayMatches(null, { orderId: "order_1", paymentId: "pay_1" }), "new");
});

test("finalized checkouts are terminal, including when the order link is missing", () => {
  assert.equal(finalizedCheckoutDisposition("FINALIZED", "order-db-1"), "replay");
  assert.equal(finalizedCheckoutDisposition("FINALIZED", null), "manual-review");
  assert.equal(finalizedCheckoutDisposition("CAPTURED", null), "continue");
});

test("a payment ID unique conflict is durable only when another checkout owns the ID", () => {
  const uniqueConflict = { code: "P2002", meta: { target: ["razorpayPaymentId"] } };
  assert.equal(isVerifiedPaymentIdConflict(uniqueConflict, "checkout-a", "checkout-b"), true);
  assert.equal(isVerifiedPaymentIdConflict(uniqueConflict, "checkout-a", null), false);
  assert.equal(isVerifiedPaymentIdConflict(uniqueConflict, "checkout-a", "checkout-a"), false);
  assert.equal(isVerifiedPaymentIdConflict({ code: "P2003" }, "checkout-a", "checkout-b"), false);
});

test("each saved pricing component is compared in paise even when the total is unchanged", () => {
  const current = { subtotal: 10000, discountAmount: 1000, shippingCharge: 500, giftWrapCharge: 199, totalAmount: 9699 };
  const variants = [
    { ...current, subtotal: 10001, discountAmount: 1001 },
    { ...current, discountAmount: 1001, shippingCharge: 501 },
    { ...current, shippingCharge: 501, giftWrapCharge: 198 },
    { ...current, giftWrapCharge: 200, subtotal: 9999 },
  ];
  for (const saved of variants) {
    assert.equal(saved.subtotal - saved.discountAmount + saved.shippingCharge + saved.giftWrapCharge, current.totalAmount);
    assert.equal(checkoutPricingMatches(saved, current), false);
  }
  assert.equal(checkoutPricingMatches({ ...current, totalAmount: 9700 }, current), false);
  assert.equal(checkoutPricingMatches(current, current), true);
});

test("Razorpay HMAC verification rejects invalid, malformed, and incomplete signatures", () => {
  const signature = createHmac("sha256", "test-secret").update("order_1|pay_1").digest("hex");
  assert.equal(verifyRazorpayHmac("order_1", "pay_1", signature, "test-secret"), true);
  assert.equal(verifyRazorpayHmac("order_1", "pay_1", signature, "wrong-secret"), false);
  assert.equal(verifyRazorpayHmac("order_1", "pay_2", signature, "test-secret"), false);
  assert.equal(verifyRazorpayHmac("order_1", "pay_1", "xyz", "test-secret"), false);
  assert.equal(verifyRazorpayHmac("order_1", "pay_1", signature, ""), false);
});

test("webhook HMAC validates the exact raw body bytes", () => {
  const raw = '{ "event": "payment.captured", "payload": {} }';
  const signature = createHmac("sha256", "webhook-secret").update(raw, "utf8").digest("hex");
  assert.equal(verifyRazorpayWebhookSignature(raw, signature, "webhook-secret"), true);
  assert.equal(verifyRazorpayWebhookSignature(raw.replaceAll(" ", ""), signature, "webhook-secret"), false);
  assert.equal(verifyRazorpayWebhookSignature(raw, signature, "wrong-secret"), false);
  assert.equal(verifyRazorpayWebhookSignature(raw, "missing", "webhook-secret"), false);
});

test("webhook event IDs detect exact replays and reject identity reuse with different content", () => {
  assert.equal(webhookEventDisposition(null, "hash-a"), "new");
  assert.equal(webhookEventDisposition({ payloadHash: "hash-a", status: "PROCESSED" }, "hash-a"), "duplicate");
  assert.equal(webhookEventDisposition({ payloadHash: "hash-a", status: "RETRY" }, "hash-a"), "retry");
  assert.equal(webhookEventDisposition({ payloadHash: "hash-a", status: "PROCESSED" }, "hash-b"), "identity-conflict");
});

test("repeated webhook event remains a no-op after durable processing", () => {
  const recorded = { payloadHash: "captured-event", status: "PROCESSED" };
  assert.equal(webhookEventDisposition(recorded, "captured-event"), "duplicate");
  assert.equal(paymentReplayMatches({ razorpayOrderId: "order_1", razorpayPaymentId: "pay_1" }, { orderId: "order_1", paymentId: "pay_1" }), "same");
});

test("an expired webhook lease can be reclaimed and the previous claim is fenced out", () => {
  const expiredAt = new Date("2026-01-01T00:02:00.000Z");
  const reclaimAt = new Date("2026-01-01T00:02:01.000Z");
  const firstLease = createWebhookClaim("claim-old", new Date("2026-01-01T00:00:00.000Z"), 120_000);
  const first = { status: "PROCESSING", ...firstLease };
  assert.equal(webhookClaimIsCurrent(first, "claim-old", expiredAt), false);
  assert.deepEqual(webhookClaimEligibilityWhere(reclaimAt), {
    OR: [
      { status: { in: ["RECEIVED", "RETRY"] } },
      { status: "PROCESSING", lockUntil: { lte: reclaimAt } },
    ],
  });

  const second = { ...first, ...createWebhookClaim("claim-new", reclaimAt, 120_000) };
  assert.equal(webhookClaimIsCurrent(second, "claim-old", reclaimAt), false);
  assert.equal(completeWebhookClaimState(second, "claim-old", reclaimAt, { status: "RETRY" }), null);
  assert.equal(webhookClaimCompletionWhere("event-1", "claim-old", reclaimAt).claimToken, "claim-old");
});

test("the current live webhook claim can complete and clears its fence", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const current = { id: "event-1", status: "PROCESSING", ...createWebhookClaim("claim-current", now, 120_000) };
  assert.equal(webhookClaimIsCurrent(current, "claim-current", now), true);
  assert.deepEqual(completeWebhookClaimState(current, "claim-current", now, { status: "PROCESSED", processedAt: now }), {
    id: "event-1", status: "PROCESSED", claimToken: null, lockUntil: null, processedAt: now,
  });
  assert.deepEqual(webhookClaimCompletionWhere("event-1", "claim-current", now), {
    id: "event-1", status: "PROCESSING", claimToken: "claim-current", lockUntil: { gt: now },
  });
});

test("webhook current payment state makes out-of-order failed events harmless", () => {
  assert.equal(paymentWebhookAction("payment.captured", "captured"), "finalize");
  assert.equal(paymentWebhookAction("payment.failed", "captured"), "finalize");
  assert.equal(paymentWebhookAction("payment.failed", "failed"), "record-failure");
  assert.equal(paymentWebhookAction("payment.captured", "failed"), "no-op");
});

test("captured checkout failures are classified for durable recovery", () => {
  assert.equal(checkoutFailureDisposition("STOCK_CONFLICT"), "recovery-required");
  assert.equal(checkoutFailureDisposition("COUPON_CUSTOMER_LIMIT"), "recovery-required");
  assert.equal(checkoutFailureDisposition("FINALIZATION_FAILED"), "retry");
});
