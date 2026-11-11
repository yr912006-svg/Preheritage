import test from "node:test";
import assert from "node:assert/strict";
import { moveCartProductToWishlist } from "./cart-wishlist.ts";

const product = { id: "db-product-1", title: "Woven stole" };
const response = (value, ok = true) => ({ ok, json: async () => value });

test("moving a database-backed cart product saves the server product before removing the cart line", async () => {
  const calls = [];
  const result = await moveCartProductToWishlist({
    itemId: "line-1", productId: product.id,
    fetcher: async (url) => { calls.push(["fetch", url]); return response({ product }); },
    save: async (value) => { calls.push(["save", value]); return { success: true }; },
    remove: (id) => calls.push(["remove", id]),
  });
  assert.deepEqual(result, { success: true, message: "Saved to your wishlist." });
  assert.equal(calls[0][0], "fetch");
  assert.deepEqual(calls[1], ["save", product]);
  assert.deepEqual(calls[2], ["remove", "line-1"]);
});

test("unavailable products or failed wishlist writes keep the cart line", async () => {
  const removed = [];
  const unavailable = await moveCartProductToWishlist({ itemId: "line-1", productId: product.id, fetcher: async () => response({ message: "Unavailable" }, false), save: async () => ({ success: true }), remove: (id) => removed.push(id) });
  const failedSave = await moveCartProductToWishlist({ itemId: "line-2", productId: product.id, fetcher: async () => response({ product }), save: async () => ({ success: false, message: "Save failed" }), remove: (id) => removed.push(id) });
  assert.equal(unavailable.success, false);
  assert.equal(failedSave.message, "Save failed");
  assert.deepEqual(removed, []);
});

test("a mismatched product response and network errors never remove the cart item", async () => {
  const removed = [];
  const mismatched = await moveCartProductToWishlist({ itemId: "line-1", productId: product.id, fetcher: async () => response({ product: { ...product, id: "other" } }), save: async () => ({ success: true }), remove: (id) => removed.push(id) });
  const network = await moveCartProductToWishlist({ itemId: "line-2", productId: product.id, fetcher: async () => { throw new Error("offline"); }, save: async () => ({ success: true }), remove: (id) => removed.push(id) });
  assert.equal(mismatched.success, false);
  assert.equal(network.success, false);
  assert.deepEqual(removed, []);
});
