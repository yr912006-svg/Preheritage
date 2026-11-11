import test from "node:test";
import assert from "node:assert/strict";
import { buildInvoiceHtml, loadOwnedInvoiceOrder } from "./order-invoice.ts";

function invoiceFixture(overrides = {}) {
  return {
    orderNumber: "PRE-123-4567", createdAt: "2026-10-20T12:00:00Z", guestName: "Mira",
    shippingAddressSnapshot: { fullName: "Mira", city: "Jaipur", state: "Rajasthan", pincode: "302001" },
    items: [{ title: "Silk saree", sku: "SKU-1", size: "Free Size", color: "Gold", quantity: 2, price: 1500, totalPrice: 3000 }],
    subtotal: 3000, discountAmount: 200, shippingCharge: 100, giftWrap: true, giftWrapCharge: 50,
    taxAmount: 0, totalAmount: 2950, paymentMethod: "COD", paymentStatus: "PENDING", ...overrides,
  };
}

test("invoice values come from persisted order and item snapshots", () => {
  const html = buildInvoiceHtml(invoiceFixture());
  assert.match(html, /Silk saree/);
  assert.match(html, /SKU-1/);
  assert.match(html, /₹1,500/);
  assert.match(html, /₹3,000/);
  assert.match(html, /Gift wrap/);
  assert.match(html, /₹2,950/);
  assert.doesNotMatch(html, /productId|userId|orderId/);
});

test("invoice escapes supplied text and safely handles absent historical fields", () => {
  const html = buildInvoiceHtml(invoiceFixture({
    guestName: null,
    shippingAddressSnapshot: null,
    items: [{ title: '<img src=x onerror="alert(1)">', quantity: null, price: null, totalPrice: null }],
    subtotal: null, discountAmount: null, shippingCharge: null, giftWrap: false, giftWrapCharge: null, taxAmount: null, totalAmount: null,
  }));
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /Unavailable/);
  assert.match(html, /Not recorded/);
  assert.doesNotMatch(html, /Gift wrap/);
});

test("invoice lookup requires an authenticated owner and scopes by public order number", async () => {
  let query;
  const db = { order: { findFirst: async (args) => { query = args; return null; } } };
  assert.deepEqual(await loadOwnedInvoiceOrder(db, null, "PRE-1"), { status: "unauthorized" });
  assert.equal(query, undefined);
  assert.deepEqual(await loadOwnedInvoiceOrder(db, "customer-1", "PRE-1"), { status: "not-found" });
  assert.deepEqual(query.where, { orderNumber: "PRE-1", userId: "customer-1" });
  assert.equal("id" in query.select, false);
});
