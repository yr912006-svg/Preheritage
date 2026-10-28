import test from "node:test";
import assert from "node:assert/strict";
import { applyStockDelta, getSellableStock, isVariantAvailable } from "./inventory.ts";

test("an active variant with positive stock is available", () => {
  const product = { stock: 0, status: "ACTIVE", variants: [{ id: "v1", stock: 3 }] };
  assert.equal(isVariantAvailable(product, "v1"), true);
  assert.equal(getSellableStock(product), 3);
});

test("a variant with zero stock is unavailable", () => {
  const product = { stock: 8, status: "ACTIVE", variants: [{ id: "v1", stock: 0 }] };
  assert.equal(isVariantAvailable(product, "v1"), false);
  assert.equal(getSellableStock(product), 0);
});

test("an explicitly inactive variant is unavailable and excluded from sellable stock", () => {
  const product = { stock: 8, status: "ACTIVE", variants: [{ id: "v1", stock: 4, isActive: false }] };
  assert.equal(isVariantAvailable(product, "v1"), false);
  assert.equal(getSellableStock(product), 0);
});

test("variant stock, rather than product-level stock, determines sellable quantity", () => {
  const product = { stock: 8, status: "ACTIVE", variants: [{ id: "v1", stock: 0 }] };
  assert.equal(getSellableStock(product), 0);
  assert.notEqual(getSellableStock(product), product.stock);
});

test("multiple variants contribute only active positive quantities", () => {
  const product = {
    stock: 20,
    status: "ACTIVE",
    variants: [
      { id: "v1", stock: 2 },
      { id: "v2", stock: 0 },
      { id: "v3", stock: 5, isActive: false },
      { id: "v4", stock: 4 },
    ],
  };
  assert.equal(getSellableStock(product), 6);
  assert.equal(isVariantAvailable(product, "v2"), false);
  assert.equal(isVariantAvailable(product, "v4"), true);
});

test("inventory adjustment allows one-unit changes only within zero and the cap", () => {
  assert.equal(applyStockDelta(0, -1), null);
  assert.equal(applyStockDelta(0, 1), 1);
  assert.equal(applyStockDelta(1, -1), 0);
  assert.equal(applyStockDelta(100000, 1), null);
  assert.equal(applyStockDelta(3, 0), null);
  assert.equal(applyStockDelta(3, 2), null);
});

test("variant stock is authoritative over the legacy product stock value", () => {
  const product = { stock: 90, status: "ACTIVE", variants: [{ id: "v1", stock: 4 }, { id: "v2", stock: 0 }] };
  assert.equal(getSellableStock(product), 4);
  assert.equal(isVariantAvailable(product, "v1"), true);
  assert.equal(isVariantAvailable(product, "v2"), false);
});
