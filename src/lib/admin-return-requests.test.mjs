import test from "node:test";
import assert from "node:assert/strict";
import { createAdminReturnRequestHandlers, canStaffTransitionReturn, RETURN_STAFF_TRANSITIONS } from "./admin-return-requests.ts";
import { withAdminCapability } from "./admin-api-access.ts";
import { adminCapabilityStatus } from "./admin-session-access.ts";

const explanation = JSON.stringify({ format: "preheritage-return-request-v1", requestType: "RETURN", orderItemIds: ["item-1"], customerExplanation: "The size did not fit." });
const request = (method, body) => new Request("https://store.test/api/admin/returns", {
  method,
  ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
});

function fixture({ role = "ORDER_MANAGER", authorized = true } = {}) {
  const row = {
    id: "return-1", orderId: "order-1", reason: "Wrong size", explanation,
    status: "REQUESTED", createdAt: new Date("2026-10-01T10:00:00.000Z"),
    order: { orderNumber: "PH-1001", items: [
      { id: "item-1", title: "Handwoven stole", sku: "STOLE-1", size: "M", color: "Ivory", quantity: 1 },
      { id: "item-2", title: "Other order line", sku: "OTHER-2", size: null, color: null, quantity: 2 },
    ] },
  };
  let findManyArgs;
  let dbCalls = 0;
  const audit = [];
  const prisma = { returnRequest: {
    async findMany(args) { dbCalls++; findManyArgs = args; return [structuredClone(row)]; },
    async updateMany({ where, data }) {
      dbCalls++;
      if (row.id !== where.id || row.status !== where.status) return { count: 0 };
      row.status = data.status;
      return { count: 1 };
    },
    async findFirst({ where }) { dbCalls++; return row.id === where.id ? { id: row.id } : null; },
  } };
  const authorize = async (capability) => {
    const admin = { id: "staff-1", role, isActive: authorized };
    const status = authorized ? adminCapabilityStatus({ id: admin.id }, admin, capability) : 401;
    return status === 200 ? { admin, status } : { admin: null, status };
  };
  const auditStore = {
    async begin(event) { audit.push({ phase: "begin", ...event }); return "audit-1"; },
    async finish(id, outcome, status) { audit.push({ phase: "finish", id, outcome, status }); },
  };
  return { handlers: createAdminReturnRequestHandlers({ prisma, authorize, auditStore, wrap: withAdminCapability }), row, audit, get dbCalls() { return dbCalls; }, get findManyArgs() { return findManyArgs; } };
}

test("transition matrix permits only review decision and item receipt steps", () => {
  assert.deepEqual(RETURN_STAFF_TRANSITIONS, {
    REQUESTED: ["APPROVED", "REJECTED"], APPROVED: ["ITEM_RECEIVED"], REJECTED: [],
    ITEM_RECEIVED: [], REFUND_INITIATED: [], COMPLETED: [],
  });
  assert.equal(canStaffTransitionReturn("REQUESTED", "APPROVED"), true);
  assert.equal(canStaffTransitionReturn("APPROVED", "ITEM_RECEIVED"), true);
  assert.equal(canStaffTransitionReturn("ITEM_RECEIVED", "REFUND_INITIATED"), false);
  assert.equal(canStaffTransitionReturn("REQUESTED", "COMPLETED"), false);
});

test("only authorized returns.manage staff can list or mutate requests", async () => {
  for (const role of ["PRODUCT_MANAGER", "CONTENT_MANAGER"]) {
    const denied = fixture({ role });
    assert.equal((await denied.handlers.GET(request("GET"))).status, 403);
    assert.equal((await denied.handlers.PATCH(request("PATCH", { id: "return-1", expectedStatus: "REQUESTED", status: "APPROVED" }))).status, 403);
    assert.equal(denied.dbCalls, 0);
    assert.equal(denied.audit.length, 0);
  }
  const unauthenticated = fixture({ authorized: false });
  assert.equal((await unauthenticated.handlers.PATCH(request("PATCH", { id: "return-1", expectedStatus: "REQUESTED", status: "APPROVED" }))).status, 401);
  assert.equal(unauthenticated.dbCalls, 0);
});

test("authorized list returns only requested order lines and minimal review data", async () => {
  const testFixture = fixture();
  const response = await testFixture.handlers.GET(request("GET"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.requests[0].orderNumber, "PH-1001");
  assert.deepEqual(body.requests[0].requestedItems, [{ title: "Handwoven stole", sku: "STOLE-1", size: "M", color: "Ivory", quantity: 1 }]);
  assert.equal(body.requests[0].explanation, "The size did not fit.");
  assert.equal("userId" in body.requests[0], false);
  assert.equal("adminNotes" in body.requests[0], false);
  assert.equal("email" in body.requests[0], false);
  assert.equal(testFixture.findManyArgs.select.order.select.items.select.image, undefined);
});

test("valid status transition is compare-and-set and audited", async () => {
  const testFixture = fixture();
  const response = await testFixture.handlers.PATCH(request("PATCH", { id: "return-1", expectedStatus: "REQUESTED", status: "APPROVED" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, request: { id: "return-1", status: "APPROVED" } });
  assert.equal(testFixture.row.status, "APPROVED");
  assert.deepEqual(testFixture.audit, [
    { phase: "begin", adminId: "staff-1", action: "PATCH /api/admin/returns (returns.manage)", target: "/api/admin/returns#return-1" },
    { phase: "finish", id: "audit-1", outcome: "SUCCESS", status: 200 },
  ]);
});

test("invalid transitions and attempts to change refund state are rejected and audited as failures", async () => {
  const testFixture = fixture();
  for (const status of ["ITEM_RECEIVED", "REFUND_INITIATED", "COMPLETED", "REQUESTED"]) {
    const response = await testFixture.handlers.PATCH(request("PATCH", { id: "return-1", expectedStatus: "REQUESTED", status }));
    assert.equal(response.status, 409);
    assert.equal(testFixture.row.status, "REQUESTED");
  }
  assert.ok(testFixture.audit.every((entry) => entry.phase !== "finish" || entry.outcome === "FAILURE"));
});

test("stale expected status cannot overwrite a concurrent staff update", async () => {
  const testFixture = fixture();
  testFixture.row.status = "APPROVED";
  const response = await testFixture.handlers.PATCH(request("PATCH", { id: "return-1", expectedStatus: "REQUESTED", status: "REJECTED" }));
  assert.equal(response.status, 409);
  assert.match((await response.json()).message, /changed since you opened it/i);
  assert.equal(testFixture.row.status, "APPROVED");
});

test("unknown requests return 404 and malformed updates are rejected", async () => {
  const testFixture = fixture();
  assert.equal((await testFixture.handlers.PATCH(request("PATCH", { id: "", expectedStatus: "REQUESTED", status: "APPROVED" }))).status, 400);
  assert.equal((await testFixture.handlers.PATCH(new Request("https://store.test/api/admin/returns", { method: "PATCH", body: "{" }))).status, 400);
  const missing = await testFixture.handlers.PATCH(request("PATCH", { id: "missing", expectedStatus: "REQUESTED", status: "APPROVED" }));
  assert.equal(missing.status, 404);
});
