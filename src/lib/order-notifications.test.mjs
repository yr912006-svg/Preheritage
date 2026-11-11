import test from "node:test";
import assert from "node:assert/strict";
import { buildOrderNotificationText, selectOrderNotification, sendCommittedOrderNotification, sendOrderNotification } from "./order-notifications.ts";
import { persistOrderStatusTransition } from "./admin-order-transition.ts";

function orderFixture(overrides = {}) {
  return {
    orderNumber: "PRE-1", status: "SHIPPED", totalAmount: 1250, guestName: "Guest", guestEmail: "guest@example.test",
    userId: null, user: null, trackingId: "TRACK-1", items: [{ title: "Silk saree", quantity: 1 }], ...overrides,
  };
}

test("notification event selection includes order and fulfillment events but excludes unsupported states", () => {
  assert.equal(selectOrderNotification("PLACED").heading, "Order received");
  assert.equal(selectOrderNotification("OUT_FOR_DELIVERY").heading, "Out for delivery");
  assert.equal(selectOrderNotification("CANCELLED").heading, "Order cancelled");
  assert.equal(selectOrderNotification("REFUNDED"), null);
  assert.equal(selectOrderNotification("UNKNOWN"), null);
});

test("notification content is based on order snapshots and does not include address or unnecessary contact data", () => {
  const text = buildOrderNotificationText({ orderNumber: "PRE-1", totalAmount: 1250, status: "SHIPPED", items: [{ title: "Persisted product name", quantity: 2 }], trackingId: "TRACK-1" });
  assert.match(text, /PRE-1/);
  assert.match(text, /₹1,250/);
  assert.match(text, /Persisted product name x 2/);
  assert.match(text, /Tracking ID: TRACK-1/);
  assert.doesNotMatch(text, /address|phone|email/i);
});

test("missing Resend configuration causes no network request", async () => {
  let calls = 0;
  const result = await sendOrderNotification({ prisma: {}, orderId: "order-1", expectedStatus: "SHIPPED", fetcher: async () => { calls++; return new Response(); } });
  assert.deepEqual(result, { status: "not-configured" });
  assert.equal(calls, 0);
});

test("notification uses the persisted guest contact and reports provider acceptance, not delivery", async () => {
  let request;
  const result = await sendOrderNotification({
    prisma: { order: { findUnique: async () => orderFixture() } }, orderId: "order-1", expectedStatus: "SHIPPED",
    apiKey: "mock-api-key", from: "PREHERITAGE <test@example.test>",
    fetcher: async (url, options) => { request = { url, options, body: JSON.parse(options.body) }; return new Response(null, { status: 200 }); },
  });
  assert.deepEqual(result, { status: "accepted" });
  assert.equal(request.body.to[0], "guest@example.test");
  assert.match(request.body.text, /PRE-1/);
  assert.doesNotMatch(request.body.text, /Guest/);
});

test("unverified account email is not used and stale events do not call Resend", async () => {
  let calls = 0;
  const unverified = await sendOrderNotification({
    prisma: { order: { findUnique: async () => orderFixture({ userId: "customer-1", guestEmail: "submitted@example.test", user: { email: "account@example.test", emailVerified: null } }) } },
    orderId: "order-1", expectedStatus: "SHIPPED", apiKey: "mock", from: "sender@example.test", fetcher: async () => { calls++; return new Response(); },
  });
  assert.deepEqual(unverified, { status: "no-recipient" });
  const stale = await sendOrderNotification({
    prisma: { order: { findUnique: async () => orderFixture({ status: "DELIVERED" }) } },
    orderId: "order-1", expectedStatus: "SHIPPED", apiKey: "mock", from: "sender@example.test", fetcher: async () => { calls++; return new Response(); },
  });
  assert.deepEqual(stale, { status: "stale-event" });
  assert.equal(calls, 0);
});

test("failed email delivery is non-throwing and a losing status transition cannot send", async () => {
  const failed = await sendOrderNotification({
    prisma: { order: { findUnique: async () => orderFixture() } }, orderId: "order-1", expectedStatus: "SHIPPED",
    apiKey: "mock", from: "sender@example.test", fetcher: async () => { throw new Error("network unavailable"); },
  });
  assert.deepEqual(failed, { status: "failed" });
  let reads = 0;
  const notCommitted = await sendCommittedOrderNotification({ order: { findUnique: async () => { reads++; return orderFixture(); } } }, null, "SHIPPED");
  assert.deepEqual(notCommitted, { status: "not-committed" });
  assert.equal(reads, 0);
});

test("committed event state must match the selected event before attempting delivery", async () => {
  let calls = 0;
  const result = await sendCommittedOrderNotification({ order: { findUnique: async () => orderFixture() } }, { id: "order-1", status: "CONFIRMED" }, "SHIPPED");
  assert.deepEqual(result, { status: "not-committed" });
  assert.equal(calls, 0);
});

test("a repeated status transition can attempt notification only for the winning conditional update", async () => {
  const order = { id: "order-1", status: "PLACED" };
  let sends = 0;
  const prisma = { order: { findUnique: async () => orderFixture({ status: order.status }) } };
  const tx = {
    order: {
      updateMany: async ({ where, data }) => {
        if (order.status !== where.status) return { count: 0 };
        order.status = data.status;
        return { count: 1 };
      },
      findUnique: async () => ({ ...order }),
    },
    orderTimeline: { create: async () => undefined },
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const committed = await persistOrderStatusTransition(tx, { orderId: "order-1", expectedStatus: "PLACED", nextStatus: "CONFIRMED", updateData: { status: "CONFIRMED" } });
    if (committed) {
      const result = await sendCommittedOrderNotification(prisma, committed, "CONFIRMED", {
        apiKey: "mock", from: "sender@example.test",
        fetcher: async () => { sends++; return new Response(null, { status: 200 }); },
      });
      assert.equal(result.status, "accepted");
    }
  }
  assert.equal(sends, 1);
});
