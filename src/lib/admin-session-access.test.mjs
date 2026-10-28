import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_CAPABILITIES,
  ADMIN_ROLES,
  adminCapabilityStatus,
  adminRoleCan,
} from "./admin-session-access.ts";

const expected = {
  SUPER_ADMIN: new Set(ADMIN_CAPABILITIES),
  PRODUCT_MANAGER: new Set([
    "products.read", "products.manage", "inventory.read", "inventory.manage", "product-images.upload",
  ]),
  ORDER_MANAGER: new Set([
    "analytics.sales.read", "orders.read", "orders.manage", "returns.manage", "coupons.manage", "inquiries.order.manage",
  ]),
  CONTENT_MANAGER: new Set([
    "reviews.moderate", "inquiries.general.manage",
  ]),
};

test("every role/capability combination matches the approved matrix", () => {
  for (const role of ADMIN_ROLES) {
    for (const capability of ADMIN_CAPABILITIES) {
      assert.equal(
        adminRoleCan(role, capability),
        expected[role].has(capability),
        `${role} ${expected[role].has(capability) ? "should" : "should not"} have ${capability}`,
      );
    }
  }
});

test("unauthenticated identities are denied even with a claimed privileged role", () => {
  assert.equal(adminCapabilityStatus({ role: "SUPER_ADMIN" }, null, "products.manage"), 401);
  assert.equal(adminCapabilityStatus(null, null, "products.manage"), 401);
});

test("inactive admins and identity/database ID mismatches are denied", () => {
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "SUPER_ADMIN", isActive: false }, "products.manage"), 403);
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-2", role: "SUPER_ADMIN", isActive: true }, "products.manage"), 403);
});

test("unknown roles and unknown capabilities fail closed, including for Super Admin", () => {
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "AUDITOR", isActive: true }, "orders.read"), 403);
  assert.equal(adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role: "SUPER_ADMIN", isActive: true }, "unknown.capability"), 403);
  assert.equal(adminRoleCan("AUDITOR", "orders.read"), false);
});

test("the current database role decides access, not role claims in the session", () => {
  const session = { id: "admin-1", role: "SUPER_ADMIN", adminRole: "SUPER_ADMIN" };
  const databaseAdmin = { id: "admin-1", role: "CONTENT_MANAGER", isActive: true };
  assert.equal(adminCapabilityStatus(session, databaseAdmin, "orders.manage"), 403);
  assert.equal(adminCapabilityStatus(session, databaseAdmin, "reviews.moderate"), 200);
});
