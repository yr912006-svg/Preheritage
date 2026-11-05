import test from "node:test";
import assert from "node:assert/strict";
import { createInquiryPostHandler, loadCustomerInquiries } from "./customer-inquiries.ts";

const validInput = {
  name: "  Asha Weaver  ", email: " ASHA@EXAMPLE.TEST ", phone: "+91 98765 43210",
  subject: "Order delivery question", message: "Please share the latest delivery estimate.",
};

function request(body, headers = {}) {
  return new Request("http://store.test/api/inquiries", {
    method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body),
  });
}

function createHarness(overrides = {}) {
  const calls = [];
  const dependencies = {
    store: { supportTicket: { create: async (args) => { calls.push(args); return { id: "ticket-1" }; } } },
    getCustomer: async () => ({ id: "customer-1" }),
    submissions: new Map(), now: () => 1_000_000,
    clientKey: (req) => req.headers.get("x-client-key") || "test-client",
    ...overrides,
  };
  return { post: createInquiryPostHandler(dependencies), calls, dependencies };
}

test("valid inquiry is trimmed, normalized, associated with the active customer, and persisted as a new general ticket", async () => {
  const { post, calls } = createHarness();
  const response = await post(request({ ...validInput, status: "RESOLVED", category: "ORDER", userId: "other-customer", orderId: "foreign-order", adminNotes: "injected" }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, id: "ticket-1" });
  assert.deepEqual(calls, [{ data: {
    guestName: "Asha Weaver", guestEmail: "asha@example.test", guestPhone: "+91 98765 43210",
    subject: "Order delivery question", message: "Please share the latest delivery estimate.",
    category: "GENERAL", status: "OPEN", userId: "customer-1",
  }, select: { id: true } }]);
});

test("valid guest inquiries persist without assigning a customer identity", async () => {
  const { post, calls } = createHarness({ getCustomer: async () => null });
  const response = await post(request(validInput));
  assert.equal(response.status, 201);
  assert.equal(Object.hasOwn(calls[0].data, "userId"), false);
});

test("missing, malformed, and oversized inquiry fields are rejected before persistence", async () => {
  const invalidBodies = [
    null,
    {},
    { ...validInput, name: "A" },
    { ...validInput, email: "not-an-email" },
    { ...validInput, phone: "abc12345" },
    { ...validInput, subject: "x" },
    { ...validInput, message: "too short" },
    { ...validInput, name: "N".repeat(121) },
    { ...validInput, email: `${"a".repeat(245)}@example.test` },
    { ...validInput, phone: "1".repeat(41) },
    { ...validInput, subject: "S".repeat(161) },
    { ...validInput, message: "M".repeat(5001) },
  ];
  const { post, calls } = createHarness();
  for (const body of invalidBodies) {
    const response = await post(request(body));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, "Please check your name, contact details, subject, and message.");
  }
  const malformed = await post(new Request("http://store.test/api/inquiries", { method: "POST", body: "{" }));
  assert.equal(malformed.status, 400);
  assert.equal(calls.length, 0);
});

test("persistence errors return a safe service response without exposing database details", async (t) => {
  t.mock.method(console, "error", () => {});
  const { post } = createHarness({ store: { supportTicket: { create: async () => { throw new Error("private database detail"); } } } });
  const response = await post(request(validInput));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.deepEqual(body, { message: "We could not save your inquiry. Please try again." });
  assert.doesNotMatch(JSON.stringify(body), /private database detail/);
});

test("honeypot submissions are acknowledged without persistence or consuming the normal rate limit", async () => {
  const { post, calls } = createHarness();
  const trap = await post(request({ website: "automated sender" }));
  assert.equal(trap.status, 200);
  assert.deepEqual(await trap.json(), { success: true });
  for (let i = 0; i < 5; i += 1) assert.equal((await post(request(validInput))).status, 201);
  assert.equal((await post(request(validInput))).status, 429);
  assert.equal(calls.length, 5);
});

test("inquiry rate limit is per client, resets after ten minutes, and invalid requests do not consume a slot", async () => {
  let timestamp = 100_000;
  const { post, calls } = createHarness({ now: () => timestamp });
  assert.equal((await post(request({ ...validInput, message: "short" }))).status, 400);
  for (let i = 0; i < 5; i += 1) assert.equal((await post(request(validInput, { "x-client-key": "client-a" }))).status, 201);
  assert.equal((await post(request(validInput, { "x-client-key": "client-a" }))).status, 429);
  assert.equal((await post(request(validInput, { "x-client-key": "client-b" }))).status, 201);
  timestamp += 10 * 60_000 + 1;
  assert.equal((await post(request(validInput, { "x-client-key": "client-a" }))).status, 201);
  assert.equal(calls.length, 7);
});

test("customer inquiry status query is owner-scoped and selects no private message or contact fields", async () => {
  let query;
  const inquiries = [{ id: "ticket-1", subject: "Order update", status: "IN_PROGRESS", createdAt: new Date(), updatedAt: new Date() }];
  const result = await loadCustomerInquiries({ supportTicket: { findMany: async (args) => { query = args; return inquiries; } } }, "customer-1");
  assert.deepEqual(result, { status: "loaded", inquiries });
  assert.deepEqual(query.where, { userId: "customer-1", category: "GENERAL" });
  assert.deepEqual(query.select, { id: true, subject: true, status: true, createdAt: true, updatedAt: true });
});

test("customer inquiry status query safely reports storage failure", async () => {
  assert.deepEqual(await loadCustomerInquiries({ supportTicket: { findMany: async () => { throw new Error("unavailable"); } } }, "customer-1"), { status: "unavailable" });
});
