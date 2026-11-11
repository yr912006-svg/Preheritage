import test from "node:test";
import assert from "node:assert/strict";
import { isValidCustomerPassword } from "./customer-password-policy.ts";

test("customer password policy accepts the bcrypt-safe 12 to 72 byte range", () => {
  assert.equal(isValidCustomerPassword("a".repeat(12)), true);
  assert.equal(isValidCustomerPassword("a".repeat(72)), true);
  assert.equal(isValidCustomerPassword("é".repeat(36)), true);
});

test("customer password policy rejects short and bcrypt-truncated values by UTF-8 byte length", () => {
  assert.equal(isValidCustomerPassword("a".repeat(11)), false);
  assert.equal(isValidCustomerPassword("a".repeat(73)), false);
  assert.equal(isValidCustomerPassword("é".repeat(37)), false);
  assert.equal(isValidCustomerPassword(null), false);
});
