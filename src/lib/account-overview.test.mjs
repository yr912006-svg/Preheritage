import test from "node:test";
import assert from "node:assert/strict";
import { loadAccountOverview } from "./account-overview.ts";

test("account overview queries are scoped to the authenticated customer", async () => {
  const calls = [];
  const db = {
    address: { findMany: async (args) => { calls.push(["address", args]); return [{ id: "address-1" }]; } },
    order: { count: async (args) => { calls.push(["order", args]); return 2; } },
    wishlistItem: { count: async (args) => { calls.push(["wishlist", args]); return 3; } },
  };

  const result = await loadAccountOverview("customer-123", db);
  assert.deepEqual(result, { addresses: [{ id: "address-1" }], orderCount: 2, wishlistCount: 3 });
  assert.equal(calls.length, 3);
  assert.ok(calls.every(([, args]) => args.where.userId === "customer-123"));
});

test("account overview database failures return a safe fallback instead of throwing", async () => {
  const db = {
    address: { findMany: async () => { throw new Error("database unavailable"); } },
    order: { count: async () => 0 },
    wishlistItem: { count: async () => 0 },
  };

  assert.equal(await loadAccountOverview("customer-123", db), null);
});
