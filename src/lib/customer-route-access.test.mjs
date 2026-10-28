import test from "node:test";
import assert from "node:assert/strict";
import { customerRouteAccess, disabledOtpLoginRedirect, safeAccountReturnPath } from "./customer-route-access.ts";

test("unauthenticated account requests go to customer login with their return path", () => {
  assert.deepEqual(customerRouteAccess(null, "/account/orders?tab=history"), {
    allow: false,
    callbackUrl: "/account/orders?tab=history",
    reason: null,
  });
});

test("active customer role is allowed by the route gate", () => {
  assert.deepEqual(customerRouteAccess({ id: "customer-id", role: "CUSTOMER" }, "/account"), {
    allow: true,
    callbackUrl: "/account",
  });
});

test("admin and super-admin identities are not treated as customer sessions", () => {
  assert.equal(customerRouteAccess({ id: "admin-id", role: "ADMIN" }, "/account").allow, false);
  assert.equal(customerRouteAccess({ id: "admin-id", role: "SUPER_ADMIN" }, "/account").allow, false);
  assert.equal(customerRouteAccess({ id: "admin-id", role: "CUSTOMER", adminRole: "SUPER_ADMIN" }, "/account").allow, false);
});

test("expired or malformed session identities are denied", () => {
  assert.equal(customerRouteAccess({ role: "CUSTOMER" }, "/account").allow, false);
  assert.equal(customerRouteAccess({ id: "", role: "CUSTOMER" }, "/account").allow, false);
});

test("customer return paths stay inside the account section", () => {
  assert.equal(safeAccountReturnPath("https://outside.invalid/"), "/account");
  assert.equal(safeAccountReturnPath("//outside.invalid/account"), "/account");
  assert.equal(safeAccountReturnPath("/admin"), "/account");
  assert.equal(safeAccountReturnPath("/account/wishlist"), "/account/wishlist");
});

test("disabled mobile OTP route returns customers to email sign-in safely", () => {
  assert.equal(disabledOtpLoginRedirect("/account/orders?tab=history"), "/login?callbackUrl=%2Faccount%2Forders%3Ftab%3Dhistory");
  assert.equal(disabledOtpLoginRedirect("https://outside.invalid/"), "/login?callbackUrl=%2Faccount");
});
