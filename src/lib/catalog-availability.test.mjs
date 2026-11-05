import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_AVAILABILITY_FILTER, filterCatalogByAvailability, isCatalogProductAvailable, parseAvailabilityFilter } from "./catalog-availability.ts";

const product = (id, stock, variants = [], fabricDetails = "Silk handloom") => ({ id, stock, status: "ACTIVE", variants, fabricDetails, title: id });

test("availability uses sellable product stock for products without variants", () => {
  assert.equal(isCatalogProductAvailable(product("available", 2)), true);
  assert.equal(isCatalogProductAvailable(product("empty", 0)), false);
});

test("availability follows aggregate sellable variant stock, not parent stock", () => {
  assert.equal(isCatalogProductAvailable(product("variant-in-stock", 0, [{ stock: 0 }, { stock: 2 }])), true);
  assert.equal(isCatalogProductAvailable(product("variant-out", 20, [{ stock: 0 }, { stock: 0 }])), false);
  assert.equal(isCatalogProductAvailable(product("variant-inactive", 20, [{ stock: 5, isActive: false }])), false);
});

test("availability intersects with fabric and search filters and returns empty results when unmatched", () => {
  const products = [
    { ...product("silk-stock-higher-price", 2, [], "Pure silk zari"), price: 120 },
    { ...product("silk-stock-lower-price", 3, [], "Pure silk cotton weave"), price: 80 },
    { ...product("cotton-stock", 3, [], "Cotton weave"), price: 60 },
    { ...product("silk-empty", 0, [], "Pure silk"), price: 50 },
  ];
  const result = filterCatalogByAvailability(products, "IN_STOCK")
    .filter((item) => item.fabricDetails.toLowerCase().includes("silk"))
    .filter((item) => item.title.toLowerCase().includes("silk"))
    .sort((left, right) => left.price - right.price);
  assert.deepEqual(result.map((item) => item.id), ["silk-stock-lower-price", "silk-stock-higher-price"]);
  assert.deepEqual(filterCatalogByAvailability(products, "OUT_OF_STOCK").filter((item) => item.fabricDetails.includes("cotton")), []);
});

test("the reset/default availability filter includes both stock states", () => {
  const products = [product("available", 1), product("unavailable", 0)];
  assert.equal(DEFAULT_AVAILABILITY_FILTER, "ALL");
  assert.equal(parseAvailabilityFilter("invalid"), DEFAULT_AVAILABILITY_FILTER);
  assert.deepEqual(filterCatalogByAvailability(products, DEFAULT_AVAILABILITY_FILTER).map((item) => item.id), ["available", "unavailable"]);
});
