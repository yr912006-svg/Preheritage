import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedProductImageUrl, normalizeProductInput, planVariantReplacement } from "./catalog-admin.ts";

const validProduct = () => ({
  title: "Varanasi Silk Saree", sku: "SAREE-01", categoryId: "cat_01", subcategoryId: "sub_01",
  collectionId: "col_01", regionId: "reg_01", description: "Handwoven silk with a detailed heritage description.",
  price: 12000, mrp: 15000, costPrice: 5000, stock: 5, lowStockAlert: 2,
  images: ["/api/storage/products/example.jpg", "https://images.unsplash.com/photo.jpg"], primaryImageIndex: 1,
  variants: [{ sku: "SAREE-01-M", size: "M", color: "Gold", colorCode: "#AABBCC", stock: 2, additionalPrice: 500 }],
});

test("product validation preserves supported taxonomy, pricing, images and variant fields", () => {
  const result = normalizeProductInput(validProduct());
  assert.equal(result.ok, true);
  assert.equal(result.value.categoryId, "cat_01");
  assert.equal(result.value.collectionId, "col_01");
  assert.equal(result.value.regionId, "reg_01");
  assert.equal(result.value.images.length, 2);
  assert.equal(result.value.primaryImageIndex, 1);
  assert.equal(result.value.variants[0].additionalPrice, 500);
  assert.equal(result.value.stock, 0, "variant stock is the source of truth for variant products");
});

test("product validation rejects invalid prices, stock, duplicate variant SKUs and image URLs", () => {
  for (const mutate of [
    (value) => { value.price = -1; },
    (value) => { value.mrp = value.price - 1; },
    (value) => { value.variants[0].stock = -1; },
    (value) => { value.variants.push({ ...value.variants[0] }); },
    (value) => { value.images = ["http://untrusted.example/image.png"]; },
    (value) => { value.images = ["/api/storage/products/../secret.png"]; },
  ]) {
    const input = validProduct(); mutate(input);
    assert.equal(normalizeProductInput(input).ok, false);
  }
});

test("products without variants use product-level stock and accept zero stock", () => {
  const input = validProduct(); input.variants = []; input.stock = 0;
  const result = normalizeProductInput(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.stock, 0);
});

test("only approved HTTPS image hosts and safe product-storage paths are accepted", () => {
  assert.equal(isAllowedProductImageUrl("/api/storage/products/uuid.webp"), true);
  assert.equal(isAllowedProductImageUrl("https://images.unsplash.com/photo.jpg"), true);
  assert.equal(isAllowedProductImageUrl("https://evil.example/photo.jpg"), false);
  assert.equal(isAllowedProductImageUrl("javascript:alert(1)"), false);
});

test("variant edits preserve ordered variants and reject foreign or order/cart-linked removals", () => {
  const existing = [
    { id: "v1", orderItemCount: 0, cartItemCount: 0 },
    { id: "v2", orderItemCount: 1, cartItemCount: 0 },
  ];
  assert.deepEqual(planVariantReplacement(existing, [{ id: "v1" }, { id: "v2" }]), { ok: true, removeIds: [] });
  assert.equal(planVariantReplacement(existing, [{ id: "foreign" }]).reason, "INVALID_VARIANT_ID");
  assert.equal(planVariantReplacement(existing, [{ id: "v1" }]).reason, "VARIANT_IN_USE");
});
