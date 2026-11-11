import test from "node:test";
import assert from "node:assert/strict";
import { createCouponValidator } from "./coupon-service.ts";
import { createCouponPreviewService } from "./coupon-preview.ts";

function fixture({ price = 1000, variantPrice = 0, stock = 8, variantStock = 8, coupon = null, orderCount = 0, now = new Date("2026-10-20T00:00:00.000Z") } = {}) {
  const prisma = {
    product: { findMany: async () => [{ id: "p1", title: "Handloom", status: "ACTIVE", price, stock, variants: variantPrice || variantStock !== 8 ? [{ id: "v1", stock: variantStock, additionalPrice: variantPrice }] : [] }] },
    coupon: { findUnique: async () => coupon },
    order: { count: async () => orderCount },
  };
  const validateCouponForOrder = createCouponValidator(prisma, () => now);
  return createCouponPreviewService({ prisma, validateCouponForOrder });
}

const cart = [{ productId: "p1", quantity: 2 }];
const activePercentCoupon = {
  code: "SAVE10", isActive: true,
  startDate: new Date("2026-10-01T00:00:00.000Z"), endDate: new Date("2026-11-01T00:00:00.000Z"),
  minOrderValue: 0, usageLimit: null, usedCount: 0, usagePerUser: 1,
  discountType: "PERCENTAGE", discountValue: 10, maxDiscount: null, freeShipping: false, firstOrderOnly: false,
};

test("validates the database price and returns the same discount rules used by checkout", async () => {
  const preview = fixture({ coupon: activePercentCoupon });
  const result = await preview({ code: " save10 ", items: [{ ...cart[0], price: 1 }], email: "guest@example.test" });
  assert.deepEqual(result, { valid: true, code: "SAVE10", subtotal: 2000, discountAmount: 200, freeShipping: false });
});

test("includes server-side variant additional price in the coupon subtotal", async () => {
  const preview = fixture({ variantPrice: 250, variantStock: 4, coupon: activePercentCoupon });
  const result = await preview({ code: "SAVE10", items: [{ productId: "p1", variantId: "v1", quantity: 2 }], email: "guest@example.test" });
  assert.equal(result.valid, true);
  assert.equal(result.subtotal, 2500);
  assert.equal(result.discountAmount, 250);
});

test("returns the shared invalid/expired coupon message", async () => {
  const expired = { ...activePercentCoupon, endDate: new Date("2026-10-19T23:59:59.000Z") };
  const preview = fixture({ coupon: expired });
  const result = await preview({ code: "SAVE10", items: cart, email: "guest@example.test" });
  assert.deepEqual(result, { valid: false, message: "This coupon is invalid, expired, or not eligible for this order." });
});

test("rejects inactive coupons during checkout eligibility validation", async () => {
  const inactive = { ...activePercentCoupon, isActive: false };
  const preview = fixture({ coupon: inactive });
  const result = await preview({ code: "SAVE10", items: cart, email: "guest@example.test" });
  assert.deepEqual(result, { valid: false, message: "This coupon is invalid, expired, or not eligible for this order." });
});

test("rejects coupons whose global usage limit is exhausted", async () => {
  const exhausted = { ...activePercentCoupon, usageLimit: 2, usedCount: 2 };
  const preview = fixture({ coupon: exhausted });
  const result = await preview({ code: "SAVE10", items: cart, email: "guest@example.test" });
  assert.deepEqual(result, { valid: false, message: "This coupon is invalid, expired, or not eligible for this order." });
});

test("returns server-side per-customer eligibility failures", async () => {
  const preview = fixture({ coupon: activePercentCoupon, orderCount: 1 });
  const result = await preview({ code: "SAVE10", items: cart, email: "guest@example.test" });
  assert.deepEqual(result, { valid: false, message: "This coupon has already been used the maximum number of times." });
});

test("does not call coupon validation when stock or variant selection is no longer eligible", async () => {
  const preview = fixture({ stock: 1, coupon: activePercentCoupon });
  const result = await preview({ code: "SAVE10", items: cart, email: "guest@example.test" });
  assert.deepEqual(result, { valid: false, message: "Insufficient stock for Handloom." });
});

test("rejects malformed cart input without trusting client prices", async () => {
  const preview = fixture({ coupon: activePercentCoupon });
  const result = await preview({ code: "SAVE10", items: [{ productId: "p1", quantity: 1.5, price: 0.01 }], email: "guest@example.test" });
  assert.deepEqual(result, { valid: false, message: "One or more cart items are invalid." });
});
