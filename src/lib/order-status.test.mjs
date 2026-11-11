import test from "node:test";
import assert from "node:assert/strict";
import { canAdminCancelOrder, canAdminTransitionOrderStatus, canTransitionOrderStatus } from "./order-status.ts";
import { persistOrderStatusTransition } from "./admin-order-transition.ts";

test("orders follow the fulfillment sequence and can only be cancelled before shipment", () => {
  assert.equal(canTransitionOrderStatus("PLACED", "CONFIRMED"), true);
  assert.equal(canTransitionOrderStatus("CONFIRMED", "PACKED"), true);
  assert.equal(canTransitionOrderStatus("PACKED", "SHIPPED"), true);
  assert.equal(canTransitionOrderStatus("SHIPPED", "CANCELLED"), false);
  assert.equal(canTransitionOrderStatus("PLACED", "DELIVERED"), false);
});

test("delivered and refunded orders are terminal; cancelled orders may be refunded", () => {
  assert.equal(canTransitionOrderStatus("DELIVERED", "CANCELLED"), false);
  assert.equal(canTransitionOrderStatus("REFUNDED", "DELIVERED"), false);
  assert.equal(canTransitionOrderStatus("CANCELLED", "REFUNDED"), true);
});

test("unknown states and repeated status updates are rejected", () => {
  assert.equal(canTransitionOrderStatus("UNKNOWN", "PLACED"), false);
  assert.equal(canTransitionOrderStatus("PLACED", "PLACED"), false);
});

test("admin order editor cannot claim a refund without the refund workflow", () => {
  assert.equal(canTransitionOrderStatus("CANCELLED", "REFUNDED"), true);
  assert.equal(canAdminTransitionOrderStatus("CANCELLED", "REFUNDED"), false);
  assert.equal(canAdminTransitionOrderStatus("PLACED", "CONFIRMED"), true);
});

test("admin cancellation is limited to eligible pre-dispatch unpaid orders", () => {
  assert.equal(canAdminCancelOrder("PLACED", "PENDING"), true);
  assert.equal(canAdminCancelOrder("CONFIRMED", "FAILED"), true);
  assert.equal(canAdminCancelOrder("PACKED", "SUCCESS"), false);
  assert.equal(canAdminCancelOrder("PLACED", "SUCCESS"), false);
  assert.equal(canAdminCancelOrder("PLACED", "REFUNDED"), false);
  assert.equal(canAdminCancelOrder("SHIPPED", "PENDING"), false);
  assert.equal(canAdminCancelOrder("UNKNOWN", "PENDING"), false);
});

test("compare-and-set status conflict writes no timeline entry", async () => {
  let timelineWrites = 0;
  let receivedWhere;
  const tx = {
    order: {
      updateMany: async (args) => { receivedWhere = args.where; return { count: 0 }; },
      findUnique: async () => assert.fail("must not read after losing the conditional update"),
    },
    orderTimeline: { create: async () => { timelineWrites += 1; } },
  };
  const result = await persistOrderStatusTransition(tx, { orderId: "order-1", expectedStatus: "PLACED", nextStatus: "CONFIRMED", updateData: { status: "CONFIRMED" } });
  assert.equal(result, null);
  assert.deepEqual(receivedWhere, { id: "order-1", status: "PLACED" });
  assert.equal(timelineWrites, 0);
});

function cancellationTx({ paymentStatus = "PENDING", updateCount = 1 } = {}) {
  const state = { order: { id: "order-1", status: "PLACED", paymentStatus }, stock: { product: 4, variant: 1 }, timelines: [], where: null };
  const tx = {
    order: {
      updateMany: async ({ where, data }) => {
        state.where = where;
        if (updateCount !== 1 || where.status !== state.order.status || where.paymentStatus !== state.order.paymentStatus) return { count: 0 };
        Object.assign(state.order, data);
        return { count: 1 };
      },
      findUnique: async () => ({ ...state.order }),
    },
    productVariant: { updateMany: async ({ data }) => { state.stock.variant += data.stock.increment; return { count: 1 }; } },
    product: { updateMany: async ({ data }) => { state.stock.product += data.stock.increment; return { count: 1 }; } },
    orderTimeline: { create: async ({ data }) => { state.timelines.push(data); } },
  };
  return { tx, state };
}

const cancellationInput = {
  orderId: "order-1", expectedStatus: "PLACED", expectedPaymentStatus: "PENDING", nextStatus: "CANCELLED",
  updateData: { status: "CANCELLED" },
  cancellationItems: [
    { productId: "product-1", variantId: "variant-1", quantity: 2 },
    { productId: "product-2", variantId: null, quantity: 3 },
  ],
};

test("eligible unpaid admin cancellation restores each inventory row once and records matching timeline", async () => {
  const { tx, state } = cancellationTx();
  const result = await persistOrderStatusTransition(tx, cancellationInput);
  assert.equal(result.status, "CANCELLED");
  assert.deepEqual(state.where, { id: "order-1", status: "PLACED", paymentStatus: "PENDING" });
  assert.deepEqual(state.stock, { product: 7, variant: 3 });
  assert.deepEqual(state.timelines, [{
    orderId: "order-1", status: "CANCELLED", title: "Order cancelled", description: "Order status updated by PREHERITAGE.",
  }]);

  const replay = await persistOrderStatusTransition(tx, cancellationInput);
  assert.equal(replay, null);
  assert.deepEqual(state.stock, { product: 7, variant: 3 });
  assert.equal(state.timelines.length, 1);
});

test("paid admin cancellation is rejected before status, inventory, or timeline writes", async () => {
  const { tx, state } = cancellationTx({ paymentStatus: "SUCCESS" });
  const result = await persistOrderStatusTransition(tx, { ...cancellationInput, expectedPaymentStatus: "SUCCESS" });
  assert.equal(result, null);
  assert.equal(state.where, null);
  assert.deepEqual(state.stock, { product: 4, variant: 1 });
  assert.equal(state.timelines.length, 0);
});

test("concurrent order or payment-state change loses compare-and-set without side effects", async () => {
  const { tx, state } = cancellationTx({ updateCount: 0 });
  const result = await persistOrderStatusTransition(tx, cancellationInput);
  assert.equal(result, null);
  assert.deepEqual(state.where, { id: "order-1", status: "PLACED", paymentStatus: "PENDING" });
  assert.deepEqual(state.stock, { product: 4, variant: 1 });
  assert.equal(state.timelines.length, 0);
});

test("cancellation transition requires the eligible payment state and item snapshot", async () => {
  const { tx, state } = cancellationTx();
  assert.equal(await persistOrderStatusTransition(tx, { ...cancellationInput, expectedPaymentStatus: undefined }), null);
  assert.equal(await persistOrderStatusTransition(tx, { ...cancellationInput, cancellationItems: undefined }), null);
  assert.equal(state.where, null);
  assert.deepEqual(state.stock, { product: 4, variant: 1 });
  assert.equal(state.timelines.length, 0);
});
