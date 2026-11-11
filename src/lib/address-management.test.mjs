import test from "node:test";
import assert from "node:assert/strict";
import { selectCheckoutAddress, updateOwnedAddress } from "./address-management.ts";

const address = { id: "address-1", userId: "customer-1", fullName: "Asha Rao", phone: "+919876543210", alternatePhone: null, pincode: "560001", houseFlat: "12A", area: "MG Road", landmark: null, city: "Bengaluru", state: "Karnataka", country: "India", isDefault: true };

function fakeDb(ownerId = "customer-1") {
  const calls = [];
  return {
    calls,
    address: { findFirst: async ({ where }) => where.userId === ownerId && where.id === address.id ? { ...address } : null },
    $transaction: async (callback) => callback({ address: {
      updateMany: async (args) => { calls.push(["default-clear", args]); return { count: 1 }; },
      update: async (args) => { calls.push(["update", args]); return { ...address, ...args.data }; },
    } }),
  };
}

test("an owner can edit a saved address and request it as the default", async () => {
  const db = fakeDb();
  const result = await updateOwnedAddress(db, "customer-1", "address-1", { fullName: "Asha R.", city: "Mysuru", isDefault: true });
  assert.equal(result.status, "updated");
  assert.equal(result.address.fullName, "Asha R.");
  assert.equal(result.address.city, "Mysuru");
  assert.equal(result.address.isDefault, true);
  assert.equal(db.calls[0][0], "default-clear");
  assert.equal(db.calls[1][1].where.userId, "customer-1");
});

test("another customer cannot read or edit an address through the ownership-scoped update", async () => {
  const db = fakeDb("customer-1");
  const result = await updateOwnedAddress(db, "customer-2", "address-1", { city: "Mysuru" });
  assert.deepEqual(result, { status: "not-found" });
  assert.deepEqual(db.calls, []);
});

test("invalid saved-address updates are rejected before writing", async () => {
  const db = fakeDb();
  const result = await updateOwnedAddress(db, "customer-1", "address-1", { pincode: "123" });
  assert.deepEqual(result, { status: "invalid" });
  assert.deepEqual(db.calls, []);
});

test("checkout selects an explicit saved address and otherwise honors the default", () => {
  const addresses = [{ ...address, id: "older", isDefault: false }, { ...address, id: "default", isDefault: true }];
  assert.equal(selectCheckoutAddress(addresses, "older").id, "older");
  assert.equal(selectCheckoutAddress(addresses).id, "default");
  assert.equal(selectCheckoutAddress([], null), null);
});
