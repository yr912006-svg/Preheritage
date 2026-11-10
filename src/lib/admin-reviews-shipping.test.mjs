import test from "node:test";
import assert from "node:assert/strict";
import { calculateShippingCharge, calculateCheckoutTotal } from "./cart-model.ts";
import { ADMIN_API_CAPABILITIES } from "./admin-api-access.ts";
import { ADMIN_ROLES, adminCapabilityStatus } from "./admin-session-access.ts";

test("shipping calculation correctly applies standard and express rules", () => {
  // Below free shipping threshold
  assert.equal(calculateShippingCharge(0, "standard"), 0);
  assert.equal(calculateShippingCharge(1000, "standard"), 250);
  assert.equal(calculateShippingCharge(4998, "standard"), 250);

  // At or above free shipping threshold (₹4,999)
  assert.equal(calculateShippingCharge(4999, "standard"), 0);
  assert.equal(calculateShippingCharge(12999, "standard"), 0);

  // Express shipping flat rate
  assert.equal(calculateShippingCharge(1000, "express"), 499);
  assert.equal(calculateShippingCharge(10000, "express"), 499);
});

test("checkout total calculation combines subtotal, shipping, COD, and gift wrap", () => {
  // Standard under threshold with COD and Gift Wrap
  const total = calculateCheckoutTotal({
    subtotal: 3000,
    shippingCharge: 250,
    codFee: 150,
    giftWrapCharge: 199,
  });
  assert.equal(total, 3599);

  // Over threshold (Free shipping) prepaid
  const freeShippingTotal = calculateCheckoutTotal({
    subtotal: 5500,
    shippingCharge: 0,
    codFee: 0,
  });
  assert.equal(freeShippingTotal, 5500);
});

test("reviews API capabilities are correctly restricted by role", () => {
  const reviewsCap = ADMIN_API_CAPABILITIES.reviews.methods.GET;
  assert.equal(reviewsCap, "reviews.moderate");

  // SUPER_ADMIN and CONTENT_MANAGER can moderate reviews
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "SUPER_ADMIN", isActive: true }, reviewsCap), 200);
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "CONTENT_MANAGER", isActive: true }, reviewsCap), 200);

  // PRODUCT_MANAGER and ORDER_MANAGER cannot moderate reviews
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "PRODUCT_MANAGER", isActive: true }, reviewsCap), 403);
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "ORDER_MANAGER", isActive: true }, reviewsCap), 403);
});

test("presigned storage API capability is correctly restricted by role", () => {
  const presignCap = ADMIN_API_CAPABILITIES.productImagePresign.methods.POST;
  assert.equal(presignCap, "product-images.upload");

  // SUPER_ADMIN and PRODUCT_MANAGER can upload/presign product images
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "SUPER_ADMIN", isActive: true }, presignCap), 200);
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "PRODUCT_MANAGER", isActive: true }, presignCap), 200);

  // ORDER_MANAGER and CONTENT_MANAGER cannot upload product images
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "ORDER_MANAGER", isActive: true }, presignCap), 403);
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "CONTENT_MANAGER", isActive: true }, presignCap), 403);
});
