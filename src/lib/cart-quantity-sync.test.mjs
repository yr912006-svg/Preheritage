import test from "node:test";
import assert from "node:assert/strict";
import { persistCartQuantityUpdate } from "./cart-quantity-sync.ts";

test("account quantity changes succeed only after the server accepts them", async () => {
  let persisted = false;
  const result = await persistCartQuantityUpdate(3, async () => {
    persisted = true;
    return { ok: true };
  });
  assert.deepEqual(result, { success: true });
  assert.equal(persisted, true);
});

test("stock conflicts and server errors preserve a visible failure result", async () => {
  assert.deepEqual(await persistCartQuantityUpdate(3, async () => ({ ok: false, message: "There is not enough stock." })), {
    success: false,
    message: "There is not enough stock.",
  });
  assert.deepEqual(await persistCartQuantityUpdate(3, async () => ({ ok: false })), {
    success: false,
    message: "We could not update the cart. Please retry.",
  });
});

test("invalid quantities are rejected without contacting the server", async () => {
  let called = false;
  const result = await persistCartQuantityUpdate(21, async () => {
    called = true;
    return { ok: true };
  });
  assert.equal(result.success, false);
  assert.equal(called, false);
});

test("network failures do not become optimistic cart success", async () => {
  const result = await persistCartQuantityUpdate(2, async () => { throw new Error("offline"); });
  assert.deepEqual(result, { success: false, message: "We could not reach the store to update your cart. Please retry." });
});
