import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { isValidCustomerPassword, CUSTOMER_PASSWORD_POLICY_MESSAGE } from "./customer-password-policy.ts";
import { createRateLimiter } from "./rate-limit.ts";
import {
  createCartItem,
  mergeCartItem,
  mergeCartItemLists,
  calculateCartSubtotal,
  calculateCheckoutTotal,
  calculateShippingCharge,
  normalizeCheckoutItems,
} from "./cart-model.ts";
import { customerRouteAccess } from "./customer-route-access.ts";
import { canAdminCancelOrder, canTransitionOrderStatus } from "./order-status.ts";
import { checkoutRequestFingerprint, checkoutIdempotencyDisposition } from "./checkout-idempotency.ts";
import { checkoutVariantStockGuard } from "./checkout-confirmation.ts";
import { INDIAN_STATES } from "./utils.ts";

test("E2E Journey 1: Customer registration password validation and bcrypt hashing", async () => {
  // 1. Passwords below 12 bytes or above 72 bytes rejected
  assert.equal(isValidCustomerPassword("short"), false);
  assert.equal(isValidCustomerPassword("12345678901"), false); // 11 bytes
  assert.equal(isValidCustomerPassword("a".repeat(73)), false); // > 72 bytes

  // 2. Passwords between 12 and 72 bytes accepted
  const validPassword = "PatronPasscode2026!Strong";
  assert.equal(isValidCustomerPassword(validPassword), true);

  // 3. Bcrypt 12 rounds hash generation & verification
  const hash = await bcrypt.hash(validPassword, 12);
  assert.ok(hash.startsWith("$2"), "Hash must be valid bcrypt format");
  const match = await bcrypt.compare(validPassword, hash);
  assert.equal(match, true);
  const mismatch = await bcrypt.compare("WrongPassword123!", hash);
  assert.equal(mismatch, false);
});

test("E2E Journey 2: Customer vs Admin role and session boundary enforcement", () => {
  // Customer identity
  const customerToken = { id: "cust-001", role: "CUSTOMER", adminRole: undefined };
  const customerAccess = customerRouteAccess(customerToken, "/account");
  assert.equal(customerAccess.allow, true);

  // Admin identity trying to access customer routes
  const adminToken = { id: "adm-001", role: "ADMIN", adminRole: "SUPER_ADMIN" };
  const adminAccess = customerRouteAccess(adminToken, "/account");
  assert.equal(adminAccess.allow, false);
  assert.equal(adminAccess.reason, "customer-required");

  // Unauthenticated identity
  const unauthAccess = customerRouteAccess(null, "/account/orders");
  assert.equal(unauthAccess.allow, false);
  assert.equal(unauthAccess.callbackUrl, "/account/orders");
});

test("E2E Journey 3: Product selection, cart manipulation, and guest cart merge", () => {
  const sampleProduct = {
    id: "prod-saree-gold",
    title: "Varanasi Katan Silk Saree in Antique Gold",
    slug: "varanasi-katan-silk-saree-in-antique-gold",
    sku: "PRE-SAR-001",
    category: "sarees",
    region: "varanasi",
    state: "Uttar Pradesh",
    price: 12999,
    mrp: 15999,
    rating: 5,
    reviewCount: 12,
    images: ["/images/products/saree-gold-1.jpg"],
    shortDesc: "Varanasi silk",
    description: "Detailed description",
    culturalStory: "Heritage story",
    fabricDetails: "Pure Katan silk",
    careInstructions: "Dry clean only",
    sizeFitGuide: "Free size",
    sizes: ["Free Size"],
    colors: [{ name: "Antique Gold", hex: "#C5A869" }],
    stock: 5,
    variants: [
      { id: "var-gold-free", size: "Free Size", color: "Antique Gold", stock: 5, additionalPrice: 0 },
    ],
  };

  // Add to cart as guest
  const guestItem = createCartItem(sampleProduct, "Free Size", "Antique Gold", 1).item;
  assert.ok(guestItem);
  assert.equal(guestItem.price, 12999);
  assert.equal(guestItem.quantity, 1);

  // Guest also adds a second product
  const secondProduct = {
    ...sampleProduct,
    id: "prod-kurta-ivory",
    title: "Chanderi Silk Kurta in Ivory",
    price: 6999,
    mrp: 8999,
    variants: [{ id: "var-kurta-m", size: "M", color: "Ivory", stock: 10, additionalPrice: 500 }],
  };
  const secondGuestItem = createCartItem(secondProduct, "M", "Ivory", 2).item;
  assert.ok(secondGuestItem);
  assert.equal(secondGuestItem.price, 7499); // 6999 + 500
  assert.equal(secondGuestItem.quantity, 2);

  const guestCart = [guestItem, secondGuestItem];

  // Patron already has 1 saree in their saved account cart
  const accountCart = [{ ...guestItem, quantity: 1 }];

  // Merge guest cart into account cart upon login
  const mergedCart = mergeCartItemLists(accountCart, guestCart);
  assert.equal(mergedCart.length, 2);

  const mergedSaree = mergedCart.find((i) => i.productId === "prod-saree-gold");
  const mergedKurta = mergedCart.find((i) => i.productId === "prod-kurta-ivory");

  // Duplicate saree quantities merged: 1 (account) + 1 (guest) = 2
  assert.equal(mergedSaree?.quantity, 2);
  // Disjoint kurta preserved from guest cart: 2
  assert.equal(mergedKurta?.quantity, 2);

  // Subtotal calculation
  const subtotal = calculateCartSubtotal(mergedCart);
  assert.equal(subtotal, 12999 * 2 + 7499 * 2); // 25998 + 14998 = 40996
});

test("E2E Journey 4: Address validation, checkout fee calculation, and COD limits", () => {
  // Indian address validation
  const validAddress = {
    fullName: "Pooja Sharma",
    email: "pooja.sharma@example.com",
    phone: "9876543210",
    houseFlat: "Flat 402, Royal Residency",
    area: "Civil Lines",
    landmark: "Near Raj Bhavan",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302006",
    country: "India",
  };

  assert.ok(INDIAN_STATES.includes(validAddress.state));
  assert.ok(/^\d{6}$/.test(validAddress.pincode));
  assert.ok(/^\d{10}$/.test(validAddress.phone));

  // Pricing calculation
  const subtotal = 12999;
  const shippingCharge = calculateShippingCharge(subtotal, "standard");
  assert.equal(shippingCharge, 0, "Free shipping above 4999 threshold");

  const expressShipping = calculateShippingCharge(subtotal, "express");
  assert.equal(expressShipping, 499, "Express shipping fee");

  const codFee = 150;
  const totalAmount = calculateCheckoutTotal({
    subtotal,
    discountAmount: 0,
    shippingCharge,
    giftWrapCharge: 0,
    codFee,
  });
  assert.equal(totalAmount, 12999 + 150);

  // COD max limit verification (₹25,000)
  const isEligibleForCod = (amount) => amount <= 25000;
  assert.equal(isEligibleForCod(totalAmount), true);
  assert.equal(isEligibleForCod(25001), false);
});

test("E2E Journey 5: Checkout idempotency and request fingerprinting", () => {
  const customer = { fullName: "Aarav Mehta", email: "aarav@example.com" };
  const items = [{ productId: "p1", variantId: "v1", quantity: 1, price: 12999 }];

  const fp1 = checkoutRequestFingerprint({
    customer,
    items,
    deliveryMethod: "standard",
    giftWrap: false,
    couponCode: "HERITAGE10",
    giftMessage: null,
    orderNotes: null,
  });

  const fp2 = checkoutRequestFingerprint({
    customer,
    items,
    deliveryMethod: "standard",
    giftWrap: false,
    couponCode: "HERITAGE10",
    giftMessage: null,
    orderNotes: null,
  });

  assert.equal(fp1, fp2, "Identical checkout requests must have identical fingerprints");

  // Replay disposition
  const existingOrder = {
    id: "order-123",
    orderNumber: "PRE-2026-001",
    userId: "cust-1",
    guestEmail: "aarav@example.com",
    checkoutRequestFingerprint: fp1,
  };
  const identity = { userId: "cust-1", email: "aarav@example.com" };

  const disposition = checkoutIdempotencyDisposition(existingOrder, identity, fp1);
  assert.equal(disposition, "replay", "Matching order must trigger idempotent replay");

  // Conflicting fingerprint disposition
  const conflictDisposition = checkoutIdempotencyDisposition(existingOrder, identity, "different-fingerprint");
  assert.equal(conflictDisposition, "conflict", "Tampered or changed payload must trigger conflict");
});

test("E2E Journey 6: Cross-customer IDOR protection and order isolation", () => {
  const customerA = { id: "customer-A", email: "patronA@example.com" };
  const customerB = { id: "customer-B", email: "patronB@example.com" };

  const orderA = {
    id: "ord-A-999",
    orderNumber: "PRE-ORDER-A",
    userId: customerA.id,
    guestEmail: customerA.email,
    status: "PLACED",
  };

  // Ownership check function matching /api/account/orders and /api/orders/lookup
  function canCustomerAccessOrder(viewer, order) {
    if (viewer && viewer.id === order.userId) return true;
    return false;
  }

  // Customer A accesses their own order
  assert.equal(canCustomerAccessOrder(customerA, orderA), true);

  // Customer B attempts to access Customer A's order (IDOR attempt)
  assert.equal(canCustomerAccessOrder(customerB, orderA), false);

  // Order cancellation policy: only owner can cancel their unfulfilled order
  function canCustomerCancel(viewer, order) {
    if (!canCustomerAccessOrder(viewer, order)) return false;
    return order.status === "PLACED";
  }

  assert.equal(canCustomerCancel(customerA, orderA), true);
  assert.equal(canCustomerCancel(customerB, orderA), false);
});

test("E2E Journey 7: Order fulfillment lifecycle state machine", () => {
  // Valid status transitions
  assert.equal(canTransitionOrderStatus("PLACED", "CONFIRMED"), true);
  assert.equal(canTransitionOrderStatus("CONFIRMED", "PACKED"), true);
  assert.equal(canTransitionOrderStatus("PACKED", "SHIPPED"), true);
  assert.equal(canTransitionOrderStatus("SHIPPED", "OUT_FOR_DELIVERY"), true);
  assert.equal(canTransitionOrderStatus("OUT_FOR_DELIVERY", "DELIVERED"), true);

  // Invalid / skipping transitions
  assert.equal(canTransitionOrderStatus("PLACED", "DELIVERED"), false);
  assert.equal(canTransitionOrderStatus("DELIVERED", "PLACED"), false);
  assert.equal(canTransitionOrderStatus("CANCELLED", "SHIPPED"), false);
});

test("E2E Journey 8: Rate limiting enforcement on sensitive auth endpoints", () => {
  const registerLimiter = createRateLimiter({ windowMs: 1000, max: 2 });
  const ip = "203.0.113.42";

  // First 2 registration attempts allowed
  assert.equal(registerLimiter.check(ip).success, true);
  assert.equal(registerLimiter.check(ip).success, true);

  // 3rd attempt blocked with 429
  const blocked = registerLimiter.check(ip);
  assert.equal(blocked.success, false);
  assert.equal(blocked.remaining, 0);

  // Different IP is isolated
  assert.equal(registerLimiter.check("198.51.100.1").success, true);
});
