import test from "node:test";
import assert from "node:assert/strict";
import { loadCustomerOrderHistory } from "./customer-order-history.ts";

test("order history and nested return requests are both scoped to the signed-in customer", async () => {
  let query;
  const orders = [{ orderNumber: "PRE-1" }];
  const result = await loadCustomerOrderHistory({ order: { findMany: async (value) => { query = value; return orders; } } }, "customer-1");
  assert.deepEqual(result, { status: "loaded", orders });
  assert.deepEqual(query.where, { userId: "customer-1" });
  assert.deepEqual(query.include.returnRequests.where, { userId: "customer-1" });
  assert.deepEqual(query.include.returnRequests.select, {
    id: true, reason: true, explanation: true, status: true, createdAt: true,
  });
  assert.equal("adminNotes" in query.include.returnRequests.select, false);
  assert.equal("pickupDate" in query.include.returnRequests.select, false);
});

test("order history database errors become an unavailable state rather than an unhandled page failure", async () => {
  const result = await loadCustomerOrderHistory({ order: { findMany: async () => { throw new Error("database unavailable"); } } }, "customer-1");
  assert.deepEqual(result, { status: "unavailable" });
});
