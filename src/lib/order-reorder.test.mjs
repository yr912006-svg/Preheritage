import test from "node:test";
import assert from "node:assert/strict";
import { createOrderReorderService } from "./order-reorder.ts";

function fixture({ items, products, cart = [] }) {
  const state = { cart: structuredClone(cart), orderReads: 0, productReads: 0, orderCreates: 0, paymentWrites: 0, casConflict: false };
  const productMap = new Map(products.map((product) => [product.id, structuredClone(product)]));
  const db = {
    order: { findFirst: async ({ where }) => {
      state.orderReads++;
      return where.orderNumber === "PRE-1" && where.userId === "customer-1" ? { items: structuredClone(items) } : null;
    } },
    $transaction: async (callback) => callback({
      product: { findUnique: async ({ where }) => { state.productReads++; return productMap.get(where.id) ?? null; } },
      cartItem: {
        findFirst: async ({ where }) => state.cart.find((row) => row.userId === where.userId && row.productId === where.productId && row.variantId === where.variantId) ?? null,
        updateMany: async ({ where, data }) => {
          if (state.casConflict) return { count: 0 };
          const row = state.cart.find((candidate) => candidate.id === where.id && candidate.userId === where.userId && candidate.quantity === where.quantity);
          if (!row) return { count: 0 };
          row.quantity = data.quantity;
          return { count: 1 };
        },
        create: async ({ data }) => { const row = { id: `cart-${state.cart.length + 1}`, ...data }; state.cart.push(row); return row; },
      },
    }),
  };
  const service = createOrderReorderService(db);
  return { state, service };
}

const orderItem = (overrides = {}) => ({ productId: "p1", variantId: "v1", title: "Silk saree", quantity: 2, price: 100, ...overrides });
const product = (overrides = {}) => ({ id: "p1", title: "Silk saree", status: "ACTIVE", price: 120, stock: 10, images: [], variants: [{ id: "v1", isActive: true, stock: 3, additionalPrice: 5 }], ...overrides });

test("unauthorized and foreign-order requests do not read the order contents or catalog", async () => {
  const { service, state } = fixture({ items: [orderItem()], products: [product()] });
  assert.deepEqual(await service.reorder(null, "PRE-1"), { status: "unauthorized" });
  assert.equal(state.orderReads, 0);
  assert.deepEqual(await service.reorder("other-customer", "PRE-1"), { status: "not-found" });
  assert.equal(state.productReads, 0);
});

test("reorder uses current variant prices, preserves unrelated cart rows, and reports changed prices", async () => {
  const unrelated = { id: "other", userId: "customer-1", productId: "other-product", variantId: null, quantity: 4 };
  const { service, state } = fixture({ items: [orderItem()], products: [product()], cart: [unrelated] });
  const result = await service.reorder("customer-1", "PRE-1");
  assert.equal(result.status, "processed");
  assert.equal(result.lines[0].status, "added");
  assert.equal(result.lines[0].addedQuantity, 2);
  assert.equal(result.lines[0].previousPrice, 100);
  assert.equal(result.lines[0].currentPrice, 125);
  assert.equal(result.lines[0].priceChanged, true);
  assert.equal(state.cart.length, 2);
  assert.equal(state.cart[0].quantity, 4);
  assert.equal(state.cart[1].quantity, 2);
  assert.equal(state.orderCreates, 0);
  assert.equal(state.paymentWrites, 0);
});

test("deleted, inactive, and stale-variant products are reported unavailable", async () => {
  const { service } = fixture({
    items: [orderItem(), orderItem({ productId: "deleted", variantId: null }), orderItem({ variantId: "gone" })],
    products: [product({ status: "DRAFT" }), product({ id: "p1", status: "ACTIVE", variants: [] })],
  });
  const result = await service.reorder("customer-1", "PRE-1");
  assert.deepEqual(result.lines.map((line) => line.status), ["unavailable", "unavailable", "unavailable"]);
});

test("stock and cart purchase limits cap additions and report conflicts", async () => {
  const { service, state } = fixture({
    items: [orderItem({ quantity: 4 })], products: [product()],
    cart: [{ id: "existing", userId: "customer-1", productId: "p1", variantId: "v1", quantity: 2 }],
  });
  const result = await service.reorder("customer-1", "PRE-1");
  assert.equal(result.lines[0].status, "partial");
  assert.equal(result.lines[0].addedQuantity, 1);
  assert.equal(state.cart[0].quantity, 3);
});

test("reorder clamps historical quantities to the current per-line cart limit", async () => {
  const { service, state } = fixture({
    items: [orderItem({ quantity: 25 })],
    products: [product({ stock: 50, variants: [{ id: "v1", isActive: true, stock: 50, additionalPrice: 5 }] })],
  });
  const result = await service.reorder("customer-1", "PRE-1");
  assert.equal(result.lines[0].status, "partial");
  assert.equal(result.lines[0].addedQuantity, 20);
  assert.equal(state.cart[0].quantity, 20);
});

test("malformed saved item quantities and malformed existing cart quantities are not overwritten", async () => {
  const { service, state } = fixture({
    items: [orderItem({ quantity: 0 })], products: [product()],
    cart: [{ id: "bad", userId: "customer-1", productId: "p1", variantId: "v1", quantity: 0 }],
  });
  const result = await service.reorder("customer-1", "PRE-1");
  assert.equal(result.lines[0].status, "invalid");
  assert.equal(state.cart[0].quantity, 0);
});

test("cart compare-and-set conflict adds no quantity", async () => {
  const { service, state } = fixture({
    items: [orderItem()], products: [product()],
    cart: [{ id: "existing", userId: "customer-1", productId: "p1", variantId: "v1", quantity: 1 }],
  });
  state.casConflict = true;
  const result = await service.reorder("customer-1", "PRE-1");
  assert.equal(result.lines[0].status, "partial");
  assert.equal(result.lines[0].addedQuantity, 0);
});
