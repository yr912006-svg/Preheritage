import test from "node:test";
import assert from "node:assert/strict";
import { createAdminInventoryHandlers } from "./admin-inventory-handlers.ts";
import { withAdminCapability } from "./admin-api-access.ts";
import { getSellableStock } from "./inventory.ts";

function fixture({ authorized = true, auditBeginFails = false, variants = [], stock = 2 } = {}) {
  const events = [];
  const calls = [];
  const state = { productStock: stock, variants: structuredClone(variants) };
  const product = {
    async findFirst() {
      calls.push("findFirst");
      return { variants: state.variants.map(({ id }) => ({ id })) };
    },
    async findUnique() {
      calls.push("findUnique");
      return { id: "product-1", stock: state.productStock, status: "ACTIVE", lowStockAlert: 3, variants: state.variants };
    },
    async updateMany(args) {
      calls.push("product.updateMany");
      const current = state.productStock;
      const guard = args.where.stock;
      if (current < (guard.gte ?? 0) || (guard.lt !== undefined && current >= guard.lt)) return { count: 0 };
      state.productStock += args.data.stock.increment;
      return { count: 1 };
    },
  };
  const productVariant = {
    async updateMany(args) {
      calls.push("productVariant.updateMany");
      const variant = state.variants.find((entry) => entry.id === args.where.id && entry.productId === args.where.productId);
      const guard = args.where.stock;
      if (!variant || variant.stock < (guard.gte ?? 0) || (guard.lt !== undefined && variant.stock >= guard.lt)) return { count: 0 };
      variant.stock += args.data.stock.increment;
      return { count: 1 };
    },
  };
  const db = { product, productVariant };
  const auditStore = {
    async begin(event) {
      if (auditBeginFails) throw new Error("audit unavailable");
      events.push({ phase: "begin", ...event });
      return "audit-1";
    },
    async finish(id, outcome, status) { events.push({ phase: "finish", id, outcome, status }); },
  };
  const authorize = async (capability) => authorized
    ? { admin: { id: "admin-1" }, status: 200 }
    : { admin: null, status: capability === "inventory.manage" ? 403 : 401 };
  return {
    handlers: createAdminInventoryHandlers({
      prisma: db,
      authorize,
      auditStore,
      wrap: withAdminCapability,
      readCapability: "inventory.read",
      mutationCapability: "inventory.manage",
      getSellableStock,
    }),
    events,
    calls,
    state,
  };
}

function patchRequest(body) {
  return new Request("https://store.test/api/admin/inventory", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("authorized inventory mutation changes stock and records successful audit", async () => {
  const { handlers, events, state } = fixture({ stock: 2 });
  const response = await handlers.PATCH(patchRequest({ productId: "product-1", delta: 1 }));
  assert.equal(response.status, 200);
  assert.equal(state.productStock, 3);
  assert.deepEqual(events, [
    { phase: "begin", adminId: "admin-1", action: "PATCH /api/admin/inventory (inventory.manage)", target: "/api/admin/inventory#product-1" },
    { phase: "finish", id: "audit-1", outcome: "SUCCESS", status: 200 },
  ]);
});

test("inventory capability denial prevents database access", async () => {
  const { handlers, calls } = fixture({ authorized: false });
  const response = await handlers.PATCH(patchRequest({ productId: "product-1", delta: 1 }));
  assert.equal(response.status, 403);
  assert.deepEqual(calls, []);
});

test("audit creation failure blocks inventory mutation before database access", async () => {
  const { handlers, calls } = fixture({ auditBeginFails: true });
  const response = await handlers.PATCH(patchRequest({ productId: "product-1", delta: 1 }));
  assert.equal(response.status, 503);
  assert.deepEqual(calls, []);
});

test("invalid quantities are rejected and recorded as failed mutations", async () => {
  const { handlers, events, calls } = fixture();
  const response = await handlers.PATCH(patchRequest({ productId: "product-1", delta: 2 }));
  assert.equal(response.status, 400);
  assert.deepEqual(calls, []);
  assert.equal(events[1].outcome, "FAILURE");
  assert.equal(events[1].status, 400);
});

test("atomic guarded updates prevent negative stock and retain concurrent increments", async () => {
  const { handlers, state, calls } = fixture({ stock: 0 });
  const decrement = await handlers.PATCH(patchRequest({ productId: "product-1", delta: -1 }));
  assert.equal(decrement.status, 409);
  assert.equal(state.productStock, 0);

  state.productStock = 1;
  const concurrent = await Promise.all([
    handlers.PATCH(patchRequest({ productId: "product-1", delta: 1 })),
    handlers.PATCH(patchRequest({ productId: "product-1", delta: 1 })),
  ]);
  assert.deepEqual(concurrent.map((response) => response.status), [200, 200]);
  assert.equal(state.productStock, 3);
  assert.equal(calls.filter((call) => call === "product.updateMany").length, 3);
});

test("variant stock is adjusted with product scoping and atomic quantity guard", async () => {
  const { handlers, state, calls } = fixture({ stock: 50, variants: [{ id: "variant-1", productId: "product-1", stock: 1, sku: "sku-1", size: "S", color: "Red" }] });
  const response = await handlers.PATCH(patchRequest({ productId: "product-1", variantId: "variant-1", delta: -1 }));
  assert.equal(response.status, 200);
  assert.equal(state.variants[0].stock, 0);
  assert.ok(calls.includes("productVariant.updateMany"));
  assert.ok(!calls.includes("product.updateMany"));
});
