import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "./admin-api-access.ts";
import { ADMIN_ROLES, adminCapabilityStatus } from "./admin-session-access.ts";

const endpoints = Object.entries(ADMIN_API_CAPABILITIES).flatMap(([, route]) =>
  Object.entries(route.methods).map(([method, capability]) => ({ path: route.path, method, capability })),
);

function fakeAuthorizer(identity, admin) {
  return async (capability) => {
    const status = adminCapabilityStatus(identity, admin, capability);
    return status === 200 ? { admin, status } : { admin: null, status };
  };
}

function memoryAuditStore(events) {
  return {
    async begin(event) {
      events.push({ phase: "begin", ...event });
      return `log-${events.length}`;
    },
    async finish(id, outcome, status) {
      events.push({ phase: "finish", id, outcome, status });
    },
  };
}

test("direct API requests enforce the approved capability for every admin role", async () => {
  for (const endpoint of endpoints) {
    for (const role of ADMIN_ROLES) {
      let reachedHandler = false;
      const events = [];
      const authorize = fakeAuthorizer({ id: "admin-1", role: "SUPER_ADMIN" }, {
        id: "admin-1", role, isActive: true,
      });
      const auditedHandler = withAdminCapability(endpoint.capability, async (request) => {
        reachedHandler = true;
        return Response.json({ method: request.method });
      }, authorize, memoryAuditStore(events));
      const request = new Request(`https://store.test${endpoint.path}`, {
        method: endpoint.method,
        ...(endpoint.method === "GET" ? {} : { body: "{}", headers: { "content-type": "application/json" } }),
      });
      const response = await auditedHandler(request);
      const allowed = adminCapabilityStatus({ id: "admin-1" }, { id: "admin-1", role, isActive: true }, endpoint.capability) === 200;
      assert.equal(response.status, allowed ? 200 : 403, `${role} ${endpoint.method} ${endpoint.path}`);
      assert.equal(reachedHandler, allowed, `${role} handler execution for ${endpoint.method} ${endpoint.path}`);
    }
  }
});

test("unauthenticated direct requests are rejected before every protected handler", async () => {
  for (const endpoint of endpoints) {
    let reachedHandler = false;
    const handler = withAdminCapability(endpoint.capability, async () => {
      reachedHandler = true;
      return Response.json({ ok: true });
    }, fakeAuthorizer(null, null));
    const request = new Request(`https://store.test${endpoint.path}`, { method: endpoint.method });
    const response = await handler(request);
    assert.equal(response.status, 401, `${endpoint.method} ${endpoint.path}`);
    assert.equal(reachedHandler, false, `${endpoint.method} ${endpoint.path}`);
  }
});

test("inactive database admins and unknown roles are rejected for direct API requests", async () => {
  for (const endpoint of endpoints) {
    for (const admin of [
      { id: "admin-1", role: "SUPER_ADMIN", isActive: false },
      { id: "admin-1", role: "UNRECOGNIZED", isActive: true },
    ]) {
      const handler = withAdminCapability(endpoint.capability, async () => Response.json({ ok: true }), fakeAuthorizer({ id: "admin-1" }, admin));
      const response = await handler(new Request(`https://store.test${endpoint.path}`, { method: endpoint.method }));
      assert.equal(response.status, 403, `${admin.role} ${endpoint.method} ${endpoint.path}`);
    }
  }
});

test("authorized mutations persist actor, action, target, outcome and status without recording request data", async () => {
  const events = [];
  let handlerSawAudit = false;
  const handler = withAdminCapability("orders.manage", async () => {
    handlerSawAudit = events[0]?.phase === "begin";
    return Response.json({ ok: true });
  }, fakeAuthorizer({ id: "admin-9" }, { id: "admin-9", role: "ORDER_MANAGER", isActive: true }), memoryAuditStore(events));
  const request = new Request("https://store.test/api/admin/orders", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orderId: "order_123", guestEmail: "private@example.test", razorpayPaymentId: "pay_secret" }),
  });
  const response = await handler(request);
  assert.equal(response.status, 200);
  assert.equal(handlerSawAudit, true, "audit intent is durable before mutation handler starts");
  assert.deepEqual(events[0], {
    phase: "begin", adminId: "admin-9", action: "PATCH /api/admin/orders (orders.manage)", target: "/api/admin/orders#order_123",
  });
  assert.deepEqual(events[1], { phase: "finish", id: "log-1", outcome: "SUCCESS", status: 200 });
  assert.equal(JSON.stringify(events).includes("private@example.test"), false);
  assert.equal(JSON.stringify(events).includes("pay_secret"), false);
});

test("failed mutation responses are recorded as failures", async () => {
  const events = [];
  const handler = withAdminCapability("products.manage", async () => Response.json({ message: "invalid" }, { status: 400 }),
    fakeAuthorizer({ id: "admin-1" }, { id: "admin-1", role: "PRODUCT_MANAGER", isActive: true }), memoryAuditStore(events));
  const response = await handler(new Request("https://store.test/api/admin/products", { method: "POST", body: "{}" }));
  assert.equal(response.status, 400);
  assert.equal(events[1].outcome, "FAILURE");
  assert.equal(events[1].status, 400);
});

test("audit storage failure blocks authorized mutations before they run", async () => {
  let reachedHandler = false;
  const handler = withAdminCapability("inventory.manage", async () => {
    reachedHandler = true;
    return Response.json({ ok: true });
  }, fakeAuthorizer({ id: "admin-1" }, { id: "admin-1", role: "PRODUCT_MANAGER", isActive: true }), {
    async begin() { throw new Error("audit unavailable"); },
    async finish() {},
  });
  const response = await handler(new Request("https://store.test/api/admin/inventory", { method: "PATCH", body: "{}" }));
  assert.equal(response.status, 503);
  assert.equal(reachedHandler, false);
});
