import test from "node:test";
import assert from "node:assert/strict";
import { createAdminCouponHandlers } from "./coupon-admin.ts";
import { withAdminCapability } from "./admin-api-access.ts";

function fixture({ authorized = true } = {}) {
  const state = [];
  const audit = [];
  const coupon = {
    async findMany() { return structuredClone(state); },
    async findUnique({ where }) { return structuredClone(state.find((item) => item.id === where.id) ?? null); },
    async create({ data }) {
      if (state.some((item) => item.code === data.code)) { const error = new Error("duplicate"); error.code = "P2002"; throw error; }
      const item = { id: `coupon-${state.length + 1}`, usedCount: 0, createdAt: new Date(), ...data }; state.push(item); return structuredClone(item);
    },
    async updateMany({ where, data }) {
      const item = state.find((entry) => entry.id === where.id && (where.usedCount?.lte === undefined || entry.usedCount <= where.usedCount.lte));
      if (!item) return { count: 0 }; Object.assign(item, data); return { count: 1 };
    },
  };
  const authorize = async (capability) => authorized && capability === "coupons.manage" ? { admin: { id: "admin-1" }, status: 200 } : { admin: null, status: authorized ? 403 : 401 };
  const auditStore = { async begin(event) { audit.push(event); return "audit-1"; }, async finish(id, outcome, status) { audit.push({ id, outcome, status }); } };
  return { handlers: createAdminCouponHandlers({ prisma: { coupon }, authorize, auditStore, wrap: withAdminCapability }), state, audit };
}
const base = { code: " hello10 ", description: " Welcome ", discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 500, maxDiscount: 200, usageLimit: 20, usagePerUser: 1, startDate: "2026-10-01T00:00:00.000Z", endDate: "2026-11-01T00:00:00.000Z", firstOrderOnly: false, freeShipping: false };
const request = (method, body) => new Request("https://store.test/api/admin/coupons", { method, headers: { "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

test("coupon creation normalizes code and editing updates fields without changing usage count", async () => {
  const { handlers, state } = fixture();
  const created = await handlers.POST(request("POST", base)); assert.equal(created.status, 201);
  assert.equal(state[0].code, "HELLO10"); assert.equal(state[0].isActive, true); assert.equal(state[0].usedCount, 0);
  const edited = await handlers.PATCH(request("PATCH", { id: state[0].id, description: "Updated", discountValue: 15 }));
  assert.equal(edited.status, 200); assert.equal(state[0].description, "Updated"); assert.equal(state[0].discountValue, 15); assert.equal(state[0].usedCount, 0);
});

test("duplicate coupon code returns conflict and database uniqueness is authoritative", async () => {
  const { handlers } = fixture(); await handlers.POST(request("POST", base));
  const duplicate = await handlers.POST(request("POST", { ...base, code: "HELLO10" })); assert.equal(duplicate.status, 409);
});

test("invalid discount values, percentage bounds, and date ranges are rejected", async () => {
  const { handlers } = fixture();
  assert.equal((await handlers.POST(request("POST", { ...base, discountValue: 0 }))).status, 400);
  assert.equal((await handlers.POST(request("POST", { ...base, discountValue: 101 }))).status, 400);
  assert.equal((await handlers.POST(request("POST", { ...base, endDate: base.startDate }))).status, 400);
  assert.equal((await handlers.POST(request("POST", { ...base, usedCount: 999 }))).status, 400);
});

test("coupon capability is required for listing and mutation; unauthorized calls do not reach database", async () => {
  const { handlers } = fixture({ authorized: false });
  assert.equal((await handlers.GET(request("GET"))).status, 401);
  assert.equal((await handlers.POST(request("POST", base))).status, 401);
  const denied = createAdminCouponHandlers({ prisma: { coupon: { findMany: async () => { throw new Error("must not run"); } } }, authorize: async () => ({ admin: null, status: 403 }), auditStore: {}, wrap: withAdminCapability });
  assert.equal((await denied.GET(request("GET"))).status, 403);
});

test("activation and deactivation update status through an audited mutation", async () => {
  const { handlers, state, audit } = fixture(); await handlers.POST(request("POST", base));
  const id = state[0].id;
  assert.equal((await handlers.PATCH(request("PATCH", { id, isActive: false }))).status, 200);
  assert.equal(state[0].isActive, false);
  assert.equal((await handlers.PATCH(request("PATCH", { id, isActive: true }))).status, 200);
  assert.equal(state[0].isActive, true); assert.ok(audit.some((entry) => entry.action.includes("coupons.manage")));
});

test("usage limits cannot be lowered beneath recorded uses and concurrent checkout counts are guarded", async () => {
  const { handlers, state } = fixture(); await handlers.POST(request("POST", base));
  state[0].usedCount = 6;
  assert.equal((await handlers.PATCH(request("PATCH", { id: state[0].id, usageLimit: 5 }))).status, 409);
  const result = await handlers.PATCH(request("PATCH", { id: state[0].id, usageLimit: 7 })); assert.equal(result.status, 200);
});
