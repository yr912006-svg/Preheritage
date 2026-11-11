import test from "node:test";
import assert from "node:assert/strict";
import { canCustomerCancelOrder, createCustomerOrderActions, decodeCustomerReturnRequest } from "./customer-order-actions.ts";

function fixture(overrides = {}) {
  const order = {
    id: "order-1", userId: "customer-1", status: "PLACED", paymentStatus: "PENDING",
    items: [
      { id: "item-1", productId: "product-1", variantId: "variant-1", quantity: 2 },
      { id: "item-2", productId: "product-2", variantId: null, quantity: 1 },
    ],
    ...overrides,
  };
  const state = { order, requests: [], restocks: [], timelines: [], locks: 0, casCount: 1 };
  const db = {
    order: { findFirst: async ({ where }) => where.id === order.id && where.userId === order.userId ? structuredClone(order) : null },
    $transaction: async (callback) => callback({
      $queryRaw: async () => { state.locks += 1; return []; },
      order: {
        findFirst: async ({ where }) => where.id === order.id && where.userId === order.userId ? structuredClone(order) : null,
        updateMany: async ({ where, data }) => {
          if (state.casCount !== 1 || where.status !== order.status || where.paymentStatus !== order.paymentStatus || where.userId !== order.userId) return { count: 0 };
          Object.assign(order, data);
          return { count: 1 };
        },
      },
      productVariant: { updateMany: async (args) => { state.restocks.push(["variant", args]); return { count: 1 }; } },
      product: { updateMany: async (args) => { state.restocks.push(["product", args]); return { count: 1 }; } },
      orderTimeline: { create: async ({ data }) => { state.timelines.push(data); } },
      returnRequest: {
        findFirst: async ({ where }) => state.requests.find((request) => request.orderId === where.orderId && where.status.in.includes(request.status)) ?? null,
        create: async ({ data }) => { const request = { id: `return-${state.requests.length + 1}`, status: "REQUESTED", createdAt: new Date("2026-10-29T00:00:00Z"), ...data }; state.requests.push(request); return request; },
      },
    }),
  };
  return { actions: createCustomerOrderActions(db, () => new Date("2026-10-29T00:00:00Z")), state, db };
}

test("customer cancellation is limited to pre-dispatch unpaid or failed orders", () => {
  assert.equal(canCustomerCancelOrder("PLACED", "PENDING"), true);
  assert.equal(canCustomerCancelOrder("CONFIRMED", "FAILED"), true);
  assert.equal(canCustomerCancelOrder("PACKED", "SUCCESS"), false);
  assert.equal(canCustomerCancelOrder("SHIPPED", "PENDING"), false);
  assert.equal(canCustomerCancelOrder("DELIVERED", "PENDING"), false);
});

test("unauthorized cancellation and return requests do not access order data", async () => {
  const { actions } = fixture();
  assert.deepEqual(await actions.cancelOrder(null, "order-1"), { status: "unauthorized" });
  assert.deepEqual(await actions.requestReturn(undefined, "order-1", {}), { status: "unauthorized" });
});

test("customer cancellation uses conditional status update and restores inventory once", async () => {
  const { actions, state } = fixture();
  assert.deepEqual(await actions.cancelOrder("customer-1", "order-1"), { status: "cancelled" });
  assert.equal(state.order.status, "CANCELLED");
  assert.equal(state.restocks.length, 2);
  assert.equal(state.restocks[0][0], "variant");
  assert.equal(state.restocks[0][1].data.stock.increment, 2);
  assert.equal(state.restocks[1][0], "product");
  assert.equal(state.restocks[1][1].data.stock.increment, 1);
  assert.equal(state.timelines.length, 1);
  assert.deepEqual(await actions.cancelOrder("customer-1", "order-1"), { status: "ineligible" });
  assert.equal(state.restocks.length, 2);
});

test("a competing order transition returns conflict and performs no restock", async () => {
  const { actions, state } = fixture();
  state.casCount = 0;
  assert.deepEqual(await actions.cancelOrder("customer-1", "order-1"), { status: "conflict" });
  assert.equal(state.restocks.length, 0);
  assert.equal(state.timelines.length, 0);
});

test("paid, shipped, and unknown-owner orders cannot be cancelled", async () => {
  const paid = fixture({ paymentStatus: "SUCCESS" });
  assert.deepEqual(await paid.actions.cancelOrder("customer-1", "order-1"), { status: "ineligible" });
  const shipped = fixture({ status: "SHIPPED" });
  assert.deepEqual(await shipped.actions.cancelOrder("customer-1", "order-1"), { status: "ineligible" });
  assert.deepEqual(await paid.actions.cancelOrder("other-customer", "order-1"), { status: "not-found" });
});

test("return requests require a delivered owned order and items from that order", async () => {
  const { actions, state } = fixture({ status: "DELIVERED" });
  const base = { requestType: "RETURN", reason: "Wrong size", itemIds: ["item-1"] };
  assert.deepEqual(await actions.requestReturn("customer-1", "order-1", { ...base, itemIds: ["foreign-item"] }), { status: "invalid-items" });
  assert.equal(state.requests.length, 0);
  assert.deepEqual(await actions.requestReturn("other-customer", "order-1", base), { status: "not-found" });
  const notDelivered = fixture({ status: "PLACED" });
  assert.deepEqual(await notDelivered.actions.requestReturn("customer-1", "order-1", base), { status: "ineligible" });
});

test("valid return and exchange requests persist type and selected item IDs without implying approval", async () => {
  const { actions, state } = fixture({ status: "DELIVERED" });
  const result = await actions.requestReturn("customer-1", "order-1", { requestType: "EXCHANGE", reason: "Wrong size", explanation: "Need the next size", itemIds: ["item-1"] });
  assert.equal(result.status, "created");
  assert.equal(result.request.status, "REQUESTED");
  assert.deepEqual(decodeCustomerReturnRequest(result.request.explanation), { requestType: "EXCHANGE", itemIds: ["item-1"], explanation: "Need the next size" });
  assert.equal(state.order.status, "DELIVERED");
});

test("duplicate active requests are rejected under the order lock", async () => {
  const { actions, state } = fixture({ status: "DELIVERED" });
  const input = { requestType: "RETURN", reason: "Damaged", itemIds: ["item-1"] };
  assert.equal((await actions.requestReturn("customer-1", "order-1", input)).status, "created");
  assert.deepEqual(await actions.requestReturn("customer-1", "order-1", input), { status: "duplicate" });
  assert.equal(state.locks, 2);
  assert.equal(state.requests.length, 1);
});

test("invalid return request types, empty items, and duplicate item IDs are rejected", async () => {
  const { actions, state } = fixture({ status: "DELIVERED" });
  assert.deepEqual(await actions.requestReturn("customer-1", "order-1", { requestType: "REFUND", reason: "Damaged", itemIds: ["item-1"] }), { status: "invalid" });
  assert.deepEqual(await actions.requestReturn("customer-1", "order-1", { requestType: "RETURN", reason: "Damaged", itemIds: [] }), { status: "invalid" });
  assert.deepEqual(await actions.requestReturn("customer-1", "order-1", { requestType: "RETURN", reason: "Damaged", itemIds: ["item-1", "item-1"] }), { status: "invalid" });
  assert.equal(state.requests.length, 0);
});
