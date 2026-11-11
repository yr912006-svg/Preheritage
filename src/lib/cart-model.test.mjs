import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCartSubtotal,
  calculateCheckoutTotal,
  calculateCouponDiscount,
  calculateShippingCharge,
  createCartItem,
  mergeCartItem,
  mergeCartItemLists,
  normalizeCartItems,
  normalizeCheckoutItems,
  removeCartItem,
  setCartItemQuantity,
} from "./cart-model.ts";

const product = {
  id: "product-1",
  title: "Varanasi Katan Silk Saree in Antique Gold",
  slug: "varanasi-katan-silk-saree-in-antique-gold",
  sku: "PRE-SAR-001",
  category: "sarees",
  region: "varanasi",
  state: "Uttar Pradesh",
  price: 12999,
  mrp: 15999,
  rating: 0,
  reviewCount: 0,
  images: [],
  shortDesc: "",
  description: "",
  culturalStory: "",
  fabricDetails: "",
  careInstructions: "",
  sizeFitGuide: "",
  sizes: ["Free Size"],
  colors: [{ name: "Antique Gold", hex: "#C5A869" }],
  stock: 7,
  variants: [{ id: "variant-1", size: "Free Size", color: "Antique Gold", stock: 5, additionalPrice: 0 }],
};

test("adding one available variant creates a positive one-quantity cart line at the product price", () => {
  const result = createCartItem(product, "Free Size", "Antique Gold", 1);
  assert.equal(result.message, undefined);
  assert.equal(result.item?.quantity, 1);
  assert.equal(result.item?.price, 12999);
  assert.equal(result.item?.variantId, "variant-1");
  assert.equal(calculateCartSubtotal([result.item]), 12999);
});

test("an out-of-stock selected variant cannot become a zero-quantity line", () => {
  const result = createCartItem({
    ...product,
    variants: [{ ...product.variants[0], stock: 0 }],
  }, "Free Size", "Antique Gold", 1);
  assert.equal(result.item, null);
  assert.match(result.message, /out of stock/i);
});

test("adding the same variant increments quantity; quantity changes and removal stay valid", () => {
  const first = createCartItem(product, "Free Size", "Antique Gold", 1).item;
  const second = createCartItem(product, "Free Size", "Antique Gold", 1).item;
  assert.ok(first && second);
  const two = mergeCartItem([first], second);
  assert.equal(two[0].quantity, 2);
  assert.equal(setCartItemQuantity(two, first.id, 3)[0].quantity, 3);
  assert.deepEqual(removeCartItem(two, first.id), []);
});

test("merging guest cart with account cart combines disjoint items and clamps shared items", () => {
  const itemA = createCartItem(product, "Free Size", "Antique Gold", 1).item;
  const itemB = { ...itemA, id: "product-2-standard-red", productId: "product-2", quantity: 2, maxStock: 5 };
  assert.ok(itemA && itemB);

  // When account cart has itemA (qty 1) and guest has itemA (qty 2) + itemB (qty 2)
  const guestCart = [{ ...itemA, quantity: 2 }, itemB];
  const accountCart = [itemA];

  const merged = mergeCartItemLists(accountCart, guestCart);
  assert.equal(merged.length, 2);
  const foundA = merged.find((item) => item.id === itemA.id);
  const foundB = merged.find((item) => item.id === itemB.id);
  assert.equal(foundA?.quantity, 3); // 1 + 2 = 3
  assert.equal(foundB?.quantity, 2); // new guest item retained
});

test("merging guest cart with duplicate items collapses them safely", () => {
  const itemA = createCartItem(product, "Free Size", "Antique Gold", 1).item;
  assert.ok(itemA);
  const guestCartWithDupes = [itemA, itemA, { ...itemA, quantity: 2 }];
  const merged = mergeCartItemLists([], guestCartWithDupes);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].quantity, 4); // 1 + 1 + 2 = 4
});

test("refresh normalization drops stale zero-quantity and zero-price local entries", () => {
  const valid = createCartItem(product, "Free Size", "Antique Gold", 1).item;
  assert.ok(valid);
  const restored = normalizeCartItems([
    valid,
    { ...valid, id: "stale-zero-quantity", quantity: 0 },
    { ...valid, id: "stale-zero-price", price: 0 },
  ]);
  assert.deepEqual(restored.map((item) => item.id), [valid.id]);
  assert.equal(restored[0].quantity, 1);
});

test("normalizing a refreshed line clamps quantity to the current server stock", () => {
  const valid = createCartItem(product, "Free Size", "Antique Gold", 1).item;
  assert.ok(valid);
  const refreshed = normalizeCartItems([{ ...valid, quantity: 6, maxStock: 2, price: 13999 }]);
  assert.equal(refreshed[0].quantity, 2);
  assert.equal(refreshed[0].price, 13999);
  assert.equal(refreshed[0].maxStock, 2);
});

test("checkout item validation rejects quantity zero and coalesces duplicate product/variant lines", () => {
  assert.match(normalizeCheckoutItems([{ productId: "p1", quantity: 0 }]).error, /invalid/i);
  assert.deepEqual(normalizeCheckoutItems([
    { productId: "p1", variantId: "v1", quantity: 1 },
    { productId: "p1", variantId: "v1", quantity: 2 },
  ]), { items: [{ productId: "p1", variantId: "v1", quantity: 3 }] });
});

test("checkout totals use the same shipping threshold and include COD only when selected", () => {
  const shipping = calculateShippingCharge(12999, "standard");
  assert.equal(shipping, 0);
  assert.equal(calculateCheckoutTotal({ subtotal: 12999, shippingCharge: shipping, codFee: 150 }), 13149);
  assert.equal(calculateCheckoutTotal({ subtotal: 12999, shippingCharge: 250, codFee: 150 }), 13399);
  assert.equal(calculateShippingCharge(2000, "standard"), 250);
  assert.equal(calculateCheckoutTotal({ subtotal: 2000, shippingCharge: 250, codFee: 150 }), 2400);
});

test("coupon previews honor the seeded minimum and maximum discount", () => {
  const coupon = { code: "HERITAGE10", type: "PERCENT", discount: 10, minimumOrderValue: 4999, maxDiscount: 5000 };
  assert.equal(calculateCouponDiscount(coupon, 4000), 0);
  assert.equal(calculateCouponDiscount(coupon, 12999), 1300);
  assert.equal(calculateCouponDiscount(coupon, 100000), 5000);
});
