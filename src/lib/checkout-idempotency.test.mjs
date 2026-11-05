import test from "node:test";
import assert from "node:assert/strict";
import { checkoutIdempotencyDisposition, checkoutRequestFingerprint, isCheckoutIdempotencyKey } from "./checkout-idempotency.ts";

const checkout = {
  customer: { email: "Guest@Example.Test", fullName: "Guest", address: { city: "Varanasi", line: "1" } },
  items: [{ productId: "product-b", variantId: null, quantity: 1 }, { productId: "product-a", variantId: "variant-a", quantity: 2 }],
  deliveryMethod: "standard", giftWrap: false, couponCode: "save10", giftMessage: null, orderNotes: "Leave at door",
};

test("checkout retry keys must be UUID-shaped rather than client order numbers", () => {
  assert.equal(isCheckoutIdempotencyKey("a40d98f4-9015-4bc0-85b5-ea93877f14a2"), true);
  assert.equal(isCheckoutIdempotencyKey("PRE-1234-CLIENT"), false);
  assert.equal(isCheckoutIdempotencyKey(undefined), false);
});

test("canonical identical retries reuse an order despite object key or item ordering", () => {
  const fingerprint = checkoutRequestFingerprint(checkout);
  const reordered = checkoutRequestFingerprint({
    ...checkout,
    customer: { address: { line: "1", city: "Varanasi" }, fullName: "Guest", email: "Guest@Example.Test" },
    items: [...checkout.items].reverse(),
    couponCode: " SAVE10 ",
  });
  assert.equal(reordered, fingerprint);
  assert.equal(checkoutIdempotencyDisposition({ userId: null, guestEmail: " guest@example.test ", checkoutRequestFingerprint: fingerprint }, { userId: null, email: "GUEST@example.test" }, reordered), "replay");
});

test("same checkout key with a changed request fingerprint is a conflict", () => {
  const fingerprint = checkoutRequestFingerprint(checkout);
  const changed = checkoutRequestFingerprint({ ...checkout, items: [{ productId: "product-b", quantity: 2 }] });
  assert.notEqual(changed, fingerprint);
  assert.equal(checkoutIdempotencyDisposition({ userId: null, guestEmail: "guest@example.test", checkoutRequestFingerprint: fingerprint }, { userId: null, email: "guest@example.test" }, changed), "conflict");
});

test("same key and fingerprint cannot be replayed by a different customer identity", () => {
  const fingerprint = checkoutRequestFingerprint(checkout);
  assert.equal(checkoutIdempotencyDisposition({ userId: "user-1", guestEmail: "guest@example.test", checkoutRequestFingerprint: fingerprint }, { userId: "user-2", email: "guest@example.test" }, fingerprint), "conflict");
  assert.equal(checkoutIdempotencyDisposition({ userId: null, guestEmail: "someone-else@example.test", checkoutRequestFingerprint: fingerprint }, { userId: null, email: "guest@example.test" }, fingerprint), "conflict");
});
