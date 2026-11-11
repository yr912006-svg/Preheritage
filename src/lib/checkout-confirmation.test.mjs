import test from "node:test";
import assert from "node:assert/strict";
import { CHECKOUT_CONFIRMATION_MAX_AGE_MS, checkoutAvailabilityConflict, checkoutNeedsPriceConfirmation, checkoutProductStockGuard, checkoutVariantStockGuard, createCheckoutConfirmationToken, isCheckoutConfirmationTokenValid } from "./checkout-confirmation.ts";
import { checkoutIdempotencyDisposition, checkoutRequestFingerprint } from "./checkout-idempotency.ts";

const secret = "unit-test-checkout-confirmation-secret";
const context = { couponCode: "SAVE10", deliveryMethod: "standard", customerIdentity: "guest@example.test", checkoutIdempotencyKey: "attempt-1" };

const price = (overrides = {}) => ({
  items: [{ productId: "p1", variantId: "v1", title: "Heritage Saree", quantity: 2, price: 1000 }],
  subtotal: 2000, discountAmount: 200, shippingCharge: 250, giftWrapCharge: 199, codFee: 150, totalAmount: 2399,
  ...overrides,
});
const expected = (value = price()) => ({
  items: value.items.map(({ productId, variantId, quantity, price: unitPrice }) => ({ productId, variantId, quantity, price: unitPrice })),
  subtotal: value.subtotal, discountAmount: value.discountAmount, shippingCharge: value.shippingCharge,
  giftWrapCharge: value.giftWrapCharge, codFee: value.codFee, totalAmount: value.totalAmount,
});

test("checkout identifies an item that became unavailable by its saved title", () => {
  assert.deepEqual(checkoutAvailabilityConflict({ title: "Heritage Saree", productActive: false, hasVariants: false, selectedVariantExists: true, availableStock: 9, requestedQuantity: 1 }), {
    code: "ITEM_UNAVAILABLE", message: "Heritage Saree is no longer available. Remove it from your bag to continue.",
  });
});

test("checkout catches insufficient variant stock before order creation", () => {
  assert.equal(checkoutAvailabilityConflict({ title: "Heritage Saree", productActive: true, hasVariants: true, selectedVariantExists: true, availableStock: 1, requestedQuantity: 2 })?.code, "STOCK_CONFLICT");
});

test("checkout catches removed variants and invalid variant selections", () => {
  assert.equal(checkoutAvailabilityConflict({ title: "Heritage Saree", productActive: true, hasVariants: true, selectedVariantExists: false, availableStock: 0, requestedQuantity: 1 })?.code, "ITEM_UNAVAILABLE");
});

test("product and variant decrements are guarded by active status, unchanged prices, and sufficient stock", () => {
  assert.deepEqual(checkoutProductStockGuard({ productId: "p1", price: 1000, quantity: 2 }), {
    id: "p1", status: "ACTIVE", price: 1000, stock: { gte: 2 },
  });
  assert.deepEqual(checkoutVariantStockGuard({ variantId: "v1", productPrice: 1000, additionalPrice: 100, quantity: 2 }), {
    id: "v1", additionalPrice: 100, stock: { gte: 2 }, product: { is: { status: "ACTIVE", price: 1000 } },
  });
});

test("price changes require explicit review before a COD order can proceed", () => {
  const current = price({ items: [{ productId: "p1", variantId: "v1", title: "Heritage Saree", quantity: 2, price: 1100 }], subtotal: 2200, totalAmount: 2599 });
  assert.equal(checkoutNeedsPriceConfirmation({ expected: expected(), confirmationToken: undefined, current, context, secret }), true);
});

test("coupon, shipping, discount, and total changes are included in review comparison", () => {
  for (const change of [
    { discountAmount: 150, totalAmount: 2449 },
    { shippingCharge: 499, totalAmount: 2648 },
    { subtotal: 2100, discountAmount: 210, totalAmount: 2489 },
    { totalAmount: 2400 },
  ]) {
    assert.equal(checkoutNeedsPriceConfirmation({ expected: expected(), confirmationToken: undefined, current: price(change), context, secret }), true);
  }
});

test("unchanged authoritative checkout matches the customer's reviewed values", () => {
  assert.equal(checkoutNeedsPriceConfirmation({ expected: expected(), confirmationToken: undefined, current: price(), context, secret }), false);
});

test("a changed item quantity does not match the customer's checkout expectation", () => {
  assert.equal(checkoutNeedsPriceConfirmation({
    expected: expected(price({ items: [{ productId: "p1", variantId: "v1", title: "Heritage Saree", quantity: 1, price: 1000 }] })),
    confirmationToken: undefined, current: price(), context, secret,
  }), true);
});

test("a reconfirmation proceeds only for the same current quote and requires review again after another change", () => {
  const confirmed = price();
  const token = createCheckoutConfirmationToken({ pricing: confirmed, context, secret, now: 1_000 });
  assert.equal(checkoutNeedsPriceConfirmation({ expected: undefined, confirmationToken: token, current: confirmed, context, secret, now: 1_001 }), false);
  assert.equal(checkoutNeedsPriceConfirmation({ expected: undefined, confirmationToken: token, current: price({ shippingCharge: 499, totalAmount: 2648 }), context, secret, now: 1_001 }), true);
});

test("confirmation token is bound to identity, cart lines and quantities, coupon, delivery, idempotency key, and quote", () => {
  const current = price();
  const token = createCheckoutConfirmationToken({ pricing: current, context, secret, now: 5_000 });
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing: current, context, secret, now: 5_001 }), true);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing: current, context: { ...context, customerIdentity: "other@example.test" }, secret, now: 5_001 }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing: current, context: { ...context, couponCode: "OTHER10" }, secret, now: 5_001 }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing: current, context: { ...context, deliveryMethod: "express" }, secret, now: 5_001 }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing: current, context: { ...context, checkoutIdempotencyKey: "attempt-2" }, secret, now: 5_001 }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing: price({ items: [{ ...current.items[0], quantity: 1 }] }), context, secret, now: 5_001 }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing: price({ items: [{ ...current.items[0], productId: "p2" }] }), context, secret, now: 5_001 }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing: price({ items: [{ ...current.items[0], price: 1001 }] }), context, secret, now: 5_001 }), false);
  const changedAddressContext = { ...context, customerIdentity: JSON.stringify({ email: "guest@example.test", houseFlat: "Different address" }) };
  const originalAddressContext = { ...context, customerIdentity: JSON.stringify({ email: "guest@example.test", houseFlat: "Original address" }) };
  const addressBoundToken = createCheckoutConfirmationToken({ pricing: current, context: originalAddressContext, secret, now: 5_000 });
  assert.equal(isCheckoutConfirmationTokenValid({ token: addressBoundToken, pricing: current, context: changedAddressContext, secret, now: 5_001 }), false);
});

test("confirmation tokens expire and reject future-issued or tampered payloads", () => {
  const pricing = price();
  const token = createCheckoutConfirmationToken({ pricing, context, secret, now: 10_000 });
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing, context, secret, now: 10_000 + CHECKOUT_CONFIRMATION_MAX_AGE_MS }), true);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing, context, secret, now: 10_001 + CHECKOUT_CONFIRMATION_MAX_AGE_MS }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing, context, secret, now: -30_001 }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token: `${token}x`, pricing, context, secret, now: 10_001 }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token: "x".repeat(4097), pricing, context, secret, now: 10_001 }), false);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing, context, secret: "different-secret", now: 10_001 }), false);
});

test("a quote token is reusable only with its original checkout key; committed retries replay idempotently", () => {
  const pricing = price();
  const token = createCheckoutConfirmationToken({ pricing, context, secret, now: 10_000 });
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing, context, secret, now: 10_001 }), true);
  assert.equal(isCheckoutConfirmationTokenValid({ token, pricing, context: { ...context, checkoutIdempotencyKey: "attempt-2" }, secret, now: 10_001 }), false);

  const request = {
    customer: { email: "guest@example.test", fullName: "Guest" },
    items: [{ productId: "p1", variantId: "v1", quantity: 2 }],
    deliveryMethod: "standard", giftWrap: true, couponCode: "SAVE10",
  };
  const fingerprint = checkoutRequestFingerprint(request);
  const existing = { userId: null, guestEmail: "guest@example.test", checkoutRequestFingerprint: fingerprint };
  assert.equal(checkoutIdempotencyDisposition(existing, { userId: null, email: "guest@example.test" }, fingerprint), "replay");
});

test("each repeated quote change invalidates the prior token until the latest quote is confirmed", () => {
  const first = price();
  const second = price({ items: [{ ...first.items[0], price: 1100 }], subtotal: 2200, totalAmount: 2599 });
  const third = price({ items: [{ ...first.items[0], price: 1200 }], subtotal: 2400, totalAmount: 2799 });
  const firstToken = createCheckoutConfirmationToken({ pricing: first, context, secret, now: 20_000 });
  assert.equal(checkoutNeedsPriceConfirmation({ expected: undefined, confirmationToken: firstToken, current: second, context, secret, now: 20_001 }), true);
  const secondToken = createCheckoutConfirmationToken({ pricing: second, context, secret, now: 20_002 });
  assert.equal(checkoutNeedsPriceConfirmation({ expected: undefined, confirmationToken: secondToken, current: third, context, secret, now: 20_003 }), true);
  const thirdToken = createCheckoutConfirmationToken({ pricing: third, context, secret, now: 20_004 });
  assert.equal(checkoutNeedsPriceConfirmation({ expected: undefined, confirmationToken: thirdToken, current: third, context, secret, now: 20_005 }), false);
});
