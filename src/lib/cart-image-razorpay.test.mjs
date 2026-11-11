import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  createCartItem,
  mergeCartItem,
  normalizeCartItems,
  updateCartItemImage,
} from "./cart-model.ts";
import {
  verifyRazorpaySignature,
  createRazorpayOrderService,
  isRazorpayServerConfigured,
} from "./razorpay.ts";
import { verifyRazorpayHmac } from "./payment-integrity.ts";

const sampleProductWithImages = {
  id: "prod-kadwa-silk",
  title: "Varanasi Katan Silk Saree",
  slug: "varanasi-katan-silk-saree",
  sku: "PRE-SAR-KADWA",
  category: "sarees",
  region: "varanasi",
  state: "Uttar Pradesh",
  price: 34999,
  mrp: 44999,
  rating: 4.9,
  reviewCount: 48,
  images: [
    "/api/storage/products/antique-gold-weave.jpg",
    "/api/storage/products/crimson-maroon-weave.jpg",
    "/api/storage/products/royal-emerald-weave.jpg",
  ],
  shortDesc: "Pure Katan silk",
  description: "Handcrafted master weave",
  culturalStory: "Kadwa technique",
  fabricDetails: "Pure silk",
  careInstructions: "Dry clean",
  sizeFitGuide: "5.5m",
  sizes: ["Free Size"],
  colors: [
    { name: "Antique Gold", hex: "#C5A869" },
    { name: "Crimson Maroon", hex: "#881337" },
    { name: "Royal Emerald", hex: "#1B4332" },
  ],
  stock: 10,
  variants: [
    { id: "var-gold", size: "Free Size", color: "Antique Gold", stock: 5, additionalPrice: 0 },
    { id: "var-crimson", size: "Free Size", color: "Crimson Maroon", stock: 3, additionalPrice: 1000 },
    { id: "var-emerald", size: "Free Size", color: "Royal Emerald", stock: 2, additionalPrice: 2000 },
  ],
};

test("createCartItem assigns the exact selected product image when provided", () => {
  const customImage = "/api/storage/products/custom-angle-view.jpg";
  const result = createCartItem(sampleProductWithImages, "Free Size", "Antique Gold", 1, customImage);
  assert.equal(result.message, undefined);
  assert.ok(result.item);
  assert.equal(result.item.image, customImage);
});

test("createCartItem synchronizes image with variant color when no custom image is specified", () => {
  // Crimson Maroon is the 2nd color (index 1), should pick the 2nd image
  const resultCrimson = createCartItem(sampleProductWithImages, "Free Size", "Crimson Maroon", 1);
  assert.ok(resultCrimson.item);
  assert.equal(resultCrimson.item.image, "/api/storage/products/crimson-maroon-weave.jpg");

  // Royal Emerald is the 3rd color (index 2), should pick the 3rd image
  const resultEmerald = createCartItem(sampleProductWithImages, "Free Size", "Royal Emerald", 1);
  assert.ok(resultEmerald.item);
  assert.equal(resultEmerald.item.image, "/api/storage/products/royal-emerald-weave.jpg");
});

test("updateCartItemImage synchronizes cart item image when customer views a new image or variant", () => {
  const initial = createCartItem(sampleProductWithImages, "Free Size", "Antique Gold", 1).item;
  assert.ok(initial);
  const cart = [initial];

  const newAngleImage = "/api/storage/products/pallu-close-up.jpg";
  const updatedCart = updateCartItemImage(cart, initial.id, newAngleImage);
  assert.equal(updatedCart[0].image, newAngleImage);
  assert.equal(updatedCart[0].id, initial.id);
  assert.equal(updatedCart[0].quantity, 1);
});

test("mergeCartItem retains the latest selected image upon adding the same variant", () => {
  const item1 = createCartItem(sampleProductWithImages, "Free Size", "Antique Gold", 1, "/api/storage/products/first.jpg").item;
  const item2 = createCartItem(sampleProductWithImages, "Free Size", "Antique Gold", 1, "/api/storage/products/latest.jpg").item;
  assert.ok(item1 && item2);

  const merged = mergeCartItem([item1], item2);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].quantity, 2);
  assert.equal(merged[0].image, "/api/storage/products/latest.jpg");
});

test("normalizeCartItems preserves image URL across page refresh or storage reload", () => {
  const valid = createCartItem(sampleProductWithImages, "Free Size", "Antique Gold", 1, "/api/storage/products/stored.jpg").item;
  assert.ok(valid);
  const normalized = normalizeCartItems([valid]);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].image, "/api/storage/products/stored.jpg");
});

test("isRazorpayServerConfigured returns false when keys are missing or placeholder", () => {
  assert.equal(isRazorpayServerConfigured(undefined, undefined), false);
  assert.equal(isRazorpayServerConfigured("", ""), false);
  assert.equal(isRazorpayServerConfigured("rzp_test_placeholder", "rzp_test_placeholder_secret"), false);
  assert.equal(isRazorpayServerConfigured("rzp_test_real123", undefined), false);
});

test("isRazorpayServerConfigured returns true when real test or live keys are configured", () => {
  assert.equal(isRazorpayServerConfigured("rzp_test_1234567890", "secret_abcdef123456"), true);
  assert.equal(isRazorpayServerConfigured("rzp_live_9876543210", "secret_9876543210ab"), true);
});

test("createRazorpayOrderService converts order total to paise and sets PREHERITAGE receipt notes", async () => {
  let capturedOptions = null;
  const mockProvider = {
    orders: {
      async create(options) {
        capturedOptions = options;
        return { id: "order_rzp_mock_1", amount: options.amount, currency: "INR" };
      },
    },
  };

  const createOrder = createRazorpayOrderService(mockProvider);
  const response = await createOrder({
    amount: 34999, // ₹34,999
    receipt: "intent_rec_001",
    notes: { orderNumber: "PRE-TEST-001" },
  });

  assert.equal(response.success, true);
  assert.ok(capturedOptions);
  assert.equal(capturedOptions.amount, 3499900); // in paise (₹34,999 * 100)
  assert.equal(capturedOptions.currency, "INR");
  assert.equal(capturedOptions.notes.brand, "PREHERITAGE");
  assert.equal(capturedOptions.notes.orderNumber, "PRE-TEST-001");
});

test("Razorpay HMAC verification validates authentic signatures and rejects forged ones", () => {
  const orderId = "order_EKwxwAgItmmXdp";
  const paymentId = "pay_29MoEhabxFMSmc";
  const secret = "EnLs pathwaysSecret123!";

  // Generate authentic signature using the HMAC utility
  const authenticSignature = crypto.createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  assert.equal(verifyRazorpayHmac(orderId, paymentId, authenticSignature, secret), true);
  assert.equal(verifyRazorpayHmac(orderId, paymentId, "forged_signature_hex", secret), false);
  assert.equal(verifyRazorpayHmac(orderId, "different_payment_id", authenticSignature, secret), false);
});
