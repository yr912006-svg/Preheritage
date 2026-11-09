import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash as digestHash, createHmac, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createCouponValidator } from "@/lib/coupon-service";
import { createCheckoutRecoveryService } from "@/lib/razorpay-checkout-recovery";
import { createRazorpayWebhookHandler } from "@/lib/razorpay-webhook-handler";
import { createRazorpayBrowserCallback } from "@/lib/razorpay-browser-callback";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required; DATABASE_URL fallbacks are prohibited.");
const target = new URL(databaseUrl);
const databaseName = decodeURIComponent(target.pathname.replace(/^\//, ""));
if ((target.searchParams.has("schema") && target.searchParams.get("schema") !== "public") || target.searchParams.has("options")) throw new Error("Integration tests require the public schema without connection search-path overrides.");
if (!new Set(["localhost", "127.0.0.1", "::1", "[::1]"]).has(target.hostname.toLowerCase())) throw new Error("Integration tests require a loopback PostgreSQL host.");
if (!databaseName.startsWith("preheritage_razorpay_it_") || process.env.CONFIRM_TEST_DATABASE_NAME !== databaseName) throw new Error("Confirm the exact preheritage_razorpay_it_ disposable database name.");

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const webhookSecret = "unit-test-webhook-secret";
const paymentSecret = "unit-test-payment-secret";
const owned = { categories: [], products: [], coupons: [], checkouts: [], events: [], eventKeys: [] };
let identityVerified = false;

async function verifyCleanupTarget() {
  const currentUrl = process.env.TEST_DATABASE_URL;
  if (!currentUrl || currentUrl !== databaseUrl) throw new Error("Refusing fixture cleanup: TEST_DATABASE_URL changed after suite startup.");
  const target = new URL(currentUrl);
  const targetName = decodeURIComponent(target.pathname.replace(/^\//, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(target.protocol) ||
      ((target.searchParams.has("schema") && target.searchParams.get("schema") !== "public") || target.searchParams.has("options")) ||
      !new Set(["localhost", "127.0.0.1", "::1", "[::1]"]).has(target.hostname.toLowerCase()) ||
      !targetName.startsWith("preheritage_razorpay_it_") ||
      process.env.CONFIRM_TEST_DATABASE_NAME !== targetName || targetName !== databaseName) {
    throw new Error("Refusing fixture cleanup: the confirmed disposable database target changed.");
  }
  const rows = await prisma.$queryRaw`SELECT current_database() AS name`;
  if (rows.length !== 1 || rows[0].name !== targetName) {
    throw new Error("Refusing fixture cleanup: current_database() no longer matches the confirmed disposable target.");
  }
}

before(async () => {
  const rows = await prisma.$queryRaw`SELECT current_database() AS name`;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, databaseName, "PostgreSQL current_database() must match the confirmed disposable target");
  identityVerified = true;
});

after(async () => {
  if (!identityVerified) { await prisma.$disconnect(); return; }
  try {
    const hasFixtures = owned.categories.length || owned.products.length || owned.coupons.length || owned.checkouts.length || owned.events.length || owned.eventKeys.length;
    if (hasFixtures) await verifyCleanupTarget();
    const linked = owned.checkouts.length
      ? await prisma.razorpayCheckout.findMany({ where: { id: { in: owned.checkouts } }, select: { orderId: true } })
      : [];
    const orderIds = linked.map((row) => row.orderId).filter(Boolean);
    if (owned.events.length || owned.eventKeys.length) {
      await verifyCleanupTarget();
      await prisma.razorpayWebhookEvent.deleteMany({ where: { OR: [
        ...(owned.events.length ? [{ id: { in: owned.events } }] : []),
        ...(owned.eventKeys.length ? [{ eventId: { in: owned.eventKeys } }] : []),
      ] } });
    }
    if (owned.checkouts.length) { await verifyCleanupTarget(); await prisma.razorpayCheckout.deleteMany({ where: { id: { in: owned.checkouts } } }); }
    if (orderIds.length) { await verifyCleanupTarget(); await prisma.order.deleteMany({ where: { id: { in: orderIds } } }); }
    if (owned.coupons.length) { await verifyCleanupTarget(); await prisma.coupon.deleteMany({ where: { id: { in: owned.coupons } } }); }
    if (owned.products.length) { await verifyCleanupTarget(); await prisma.product.deleteMany({ where: { id: { in: owned.products } } }); }
    if (owned.categories.length) { await verifyCleanupTarget(); await prisma.category.deleteMany({ where: { id: { in: owned.categories } } }); }
  } finally {
    await prisma.$disconnect();
  }
});

function makeProvider(overrides = {}) {
  const order = { id: `order_${randomUUID()}`, amount: 125000, currency: "INR", ...overrides.order };
  const payment = { id: `pay_${randomUUID()}`, order_id: order.id, amount: order.amount, currency: "INR", status: "captured", ...overrides.payment };
  return { order, payment, provider: { orders: { fetch: async (id) => id === order.id ? order : { ...order, id } }, payments: { fetch: async (id) => id === payment.id ? payment : { ...payment, id, order_id: order.id } } } };
}

function makeHandler({ provider, recovery, hooks, tokens } = {}) {
  return createRazorpayWebhookHandler({
    prisma, provider, webhookSecret: () => webhookSecret,
    markCapturedCheckout: recovery.markCapturedCheckout,
    isRecoveryError: (error) => error?.name === "CheckoutRecoveryError",
    hooks, newClaimToken: tokens ? () => tokens.shift() : randomUUID,
  });
}

function signedRequest(eventId, body) {
  owned.eventKeys.push(eventId);
  const raw = JSON.stringify(body);
  const signature = createHmac("sha256", webhookSecret).update(raw).digest("hex");
  return new Request("http://localhost/api/razorpay/webhook", { method: "POST", headers: { "content-type": "application/json", "x-razorpay-signature": signature, "x-razorpay-event-id": eventId }, body: raw });
}

function capturedBody(orderId, paymentId, event = "payment.captured") {
  return { event, payload: { payment: { entity: { id: paymentId, order_id: orderId } } } };
}

function makeBarrier(parties) {
  let arrived = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  return async () => { arrived += 1; if (arrived === parties) release(); await gate; };
}

function gateProvider(provider, parties) {
  const gate = makeBarrier(parties);
  return {
    orders: { fetch: async (id) => { await gate(); return provider.orders.fetch(id); } },
    payments: { fetch: async (id) => { await gate(); return provider.payments.fetch(id); } },
  };
}

async function makeFixture({ coupon = false, stock = 8, pricing = {}, couponOptions = {} } = {}) {
  const id = randomUUID().replaceAll("-", "").slice(0, 12);
  const category = await prisma.category.create({ data: { name: `IT ${id}`, slug: `it-${id}` } });
  owned.categories.push(category.id);
  const product = await prisma.product.create({ data: {
    title: `Integration product ${id}`, slug: `integration-product-${id}`, sku: `IT-${id}`,
    description: "Integration fixture", price: 1000, mrp: 1000, categoryId: category.id, stock,
  } });
  owned.products.push(product.id);
  let couponRow = null;
  if (coupon) {
    couponRow = await prisma.coupon.create({ data: {
      code: `IT${id}`.toUpperCase(), discountType: "FIXED", discountValue: 100,
      minOrderValue: 0, usageLimit: 10, usagePerUser: 1, startDate: new Date(Date.now() - 60_000),
      endDate: new Date(Date.now() + 86_400_000), isActive: true, ...couponOptions,
    } });
    owned.coupons.push(couponRow.id);
  }
  const email = `guest-${id}@example.test`;
  const couponCode = couponRow?.code ?? null;
  const currentTotal = 1000 - (couponRow ? 100 : 0) + 250 + (pricing.giftWrapCharge ?? 0);
  const snapshotPricing = {
    subtotal: 1000, discountAmount: couponRow ? 100 : 0, shippingCharge: 250,
    giftWrapCharge: 0, totalAmount: currentTotal, ...pricing,
  };
  const snapshot = {
    customer: { fullName: "Integration Guest", email, phone: "9000000000", houseFlat: "1", area: "Test", city: "Test", state: "Test", pincode: "123456", country: "India" },
    items: [{ productId: product.id, variantId: null, quantity: 1 }], userId: null,
    couponCode, deliveryMethod: "standard", giftWrap: false, giftMessage: null, orderNotes: null, pricing: snapshotPricing,
  };
  const gateway = makeProvider({ order: { amount: Math.round(currentTotal * 100) } });
  const intent = await prisma.razorpayCheckout.create({ data: {
    customerEmail: email, amount: currentTotal, currency: "INR", snapshot,
    razorpayOrderId: gateway.order.id,
  } });
  owned.checkouts.push(intent.id);
  const validator = createCouponValidator(prisma);
  const recovery = createCheckoutRecoveryService({ prisma, validateCouponForOrder: validator });
  return { id, product, coupon: couponRow, intent, gateway, recovery, email };
}

async function orderPaymentCounts(fixture) {
  const payments = await prisma.payment.count({ where: { razorpayOrderId: fixture.gateway.order.id } });
  const orders = await prisma.order.count({ where: { payment: { razorpayOrderId: fixture.gateway.order.id } } });
  return { payments, orders };
}

async function assertPaymentIdentity(fixture) {
  const records = await prisma.payment.findMany({ where: { razorpayOrderId: fixture.gateway.order.id }, select: { razorpayOrderId: true, razorpayPaymentId: true } });
  assert.ok(records.every((row) => row.razorpayOrderId === fixture.gateway.order.id && row.razorpayPaymentId === fixture.gateway.payment.id));
}

test("same webhook event delivered twice finalizes one order and payment", async () => {
  const f = await makeFixture({ coupon: true });
  let releaseFirst;
  const pauseFirst = new Promise((resolve) => { releaseFirst = resolve; });
  let claimedFirst;
  const firstClaimed = new Promise((resolve) => { claimedFirst = resolve; });
  let first = true;
  const handler = makeHandler({ provider: f.gateway.provider, recovery: f.recovery, hooks: { afterClaim: async () => { if (first) { first = false; claimedFirst(); await pauseFirst; } } } });
  const eventId = `evt-${f.id}`;
  const body = capturedBody(f.gateway.order.id, f.gateway.payment.id);
  const firstResponse = handler(signedRequest(eventId, body));
  await firstClaimed;
  const secondResponse = await handler(signedRequest(eventId, body));
  releaseFirst();
  const firstResult = await firstResponse;
  assert.equal(firstResult.status, 200); assert.equal(secondResponse.status, 503);
  const counts = await orderPaymentCounts(f);
  assert.deepEqual(counts, { orders: 1, payments: 1 });
  await assertPaymentIdentity(f);
  assert.equal(await prisma.product.findUnique({ where: { id: f.product.id } }).then((row) => row.stock), 7);
  assert.equal(await prisma.coupon.findUnique({ where: { id: f.coupon.id } }).then((row) => row.usedCount), 1);
  const event = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId } });
  owned.events.push(event.id);
  assert.equal(event.status, "PROCESSED");
  const replay = await handler(signedRequest(eventId, body));
  assert.equal(replay.status, 200);
  assert.deepEqual(await orderPaymentCounts(f), { orders: 1, payments: 1 });
});

test("different event identities for one captured payment cannot duplicate financial or inventory effects", async () => {
  const f = await makeFixture({ coupon: true });
  const handler = makeHandler({ provider: f.gateway.provider, recovery: f.recovery, hooks: { afterProviderVerification: makeBarrier(2) } });
  const body = capturedBody(f.gateway.order.id, f.gateway.payment.id);
  await Promise.all([handler(signedRequest(`evt-a-${f.id}`, body)), handler(signedRequest(`evt-b-${f.id}`, body))]);
  assert.deepEqual(await orderPaymentCounts(f), { orders: 1, payments: 1 });
  await assertPaymentIdentity(f);
  const rows = await prisma.razorpayWebhookEvent.findMany({ where: { eventId: { in: [`evt-a-${f.id}`, `evt-b-${f.id}`] } } });
  for (const row of rows) owned.events.push(row.id);
  assert.equal(rows.length, 2); assert.ok(rows.every((row) => row.status === "PROCESSED"));
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 7);
  assert.equal((await prisma.coupon.findUnique({ where: { id: f.coupon.id } })).usedCount, 1);
});

test("browser callback racing webhook creates one order, payment, stock decrement, and coupon claim", async () => {
  const f = await makeFixture({ coupon: true });
  const provider = gateProvider(f.gateway.provider, 4);
  const handler = makeHandler({ provider, recovery: f.recovery });
  const browser = createRazorpayBrowserCallback({ prisma, provider, paymentSecret: () => paymentSecret, verifySignature: () => true, markCapturedCheckout: f.recovery.markCapturedCheckout });
  const [webhookResponse, browserResult] = await Promise.all([
    handler(signedRequest(`evt-race-${f.id}`, capturedBody(f.gateway.order.id, f.gateway.payment.id))),
    browser({ accountUser: null, customer: { email: f.email }, orderId: f.gateway.order.id, paymentId: f.gateway.payment.id, signature: "mock" }),
  ]);
  const browserResponse = browserResult?.response ?? browserResult;
  assert.ok([200, 503].includes(webhookResponse.status));
  assert.ok(browserResponse.status === 200 || browserResponse.status === 409);
  assert.deepEqual(await orderPaymentCounts(f), { orders: 1, payments: 1 });
  await assertPaymentIdentity(f);
  const repeatedBrowserResult = await browser({ accountUser: null, customer: { email: f.email }, orderId: f.gateway.order.id, paymentId: f.gateway.payment.id, signature: "mock" });
  const repeatedBrowser = repeatedBrowserResult?.response ?? repeatedBrowserResult;
  assert.equal(repeatedBrowser.status, 200);
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 7);
  assert.equal((await prisma.coupon.findUnique({ where: { id: f.coupon.id } })).usedCount, 1);
});

test("payment ID uniqueness conflict remains reviewable without order or stock effects", async () => {
  const owner = await makeFixture();
  const conflicted = await makeFixture({ coupon: true });
  await prisma.razorpayCheckout.update({ where: { id: owner.intent.id }, data: { razorpayPaymentId: owner.gateway.payment.id, status: "CAPTURED" } });
  conflicted.gateway.payment.id = owner.gateway.payment.id;
  const handler = makeHandler({ provider: conflicted.gateway.provider, recovery: conflicted.recovery });
  const eventId = `evt-conflict-${conflicted.id}`;
  const response = await handler(signedRequest(eventId, capturedBody(conflicted.gateway.order.id, conflicted.gateway.payment.id)));
  assert.equal(response.status, 200);
  assert.deepEqual(await orderPaymentCounts(conflicted), { orders: 0, payments: 0 });
  assert.equal((await prisma.product.findUnique({ where: { id: conflicted.product.id } })).stock, 8);
  const checkout = await prisma.razorpayCheckout.findUnique({ where: { id: conflicted.intent.id } });
  const event = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId } }); owned.events.push(event.id);
  assert.equal(checkout.status, "RECOVERY_REQUIRED"); assert.equal(event.status, "RECOVERY_REQUIRED");
  assert.equal(await prisma.order.count({ where: { couponCode: conflicted.coupon?.code } }), 0);
});

test("stock conflict and same-customer coupon race permit only one finalization", async () => {
  const a = await makeFixture({ coupon: true, stock: 1, couponOptions: { usagePerUser: 1 } });
  const b = await makeFixture({ stock: 1 });
  // Share coupon and guest identity so the transaction-scoped customer/coupon lock serializes eligibility.
  await prisma.razorpayCheckout.update({ where: { id: b.intent.id }, data: { customerEmail: a.email, snapshot: { ...b.intent.snapshot, customer: { ...b.intent.snapshot.customer, email: a.email }, couponCode: a.coupon.code, items: [{ productId: a.product.id, variantId: null, quantity: 1 }] } } });
  // Use a second independent product only for the stock-conflict half; coupon race is serialized by shared identity.
  const coupon = await prisma.coupon.findUnique({ where: { id: a.coupon.id } });
  const secondCheckout = await prisma.razorpayCheckout.update({ where: { id: b.intent.id }, data: { snapshot: { ...b.intent.snapshot, couponCode: coupon.code, pricing: { ...b.intent.snapshot.pricing, discountAmount: 100, totalAmount: 1150 } }, amount: 1150 } });
  const gatewayB = makeProvider({ order: { amount: 115000 } });
  await prisma.razorpayCheckout.update({ where: { id: secondCheckout.id }, data: { razorpayOrderId: gatewayB.order.id } });
  const serviceB = createCheckoutRecoveryService({ prisma, validateCouponForOrder: createCouponValidator(prisma) });
  const providerA = gateProvider(a.gateway.provider, 2);
  const providerB = gateProvider(gatewayB.provider, 2);
  const handlerA = makeHandler({ provider: providerA, recovery: a.recovery });
  const handlerB = makeHandler({ provider: providerB, recovery: serviceB });
  await Promise.all([handlerA(signedRequest(`evt-stock-${a.id}`, capturedBody(a.gateway.order.id, a.gateway.payment.id))), handlerB(signedRequest(`evt-stock-${b.id}`, capturedBody(gatewayB.order.id, gatewayB.payment.id)))]);
  assert.equal(await prisma.order.count({ where: { couponCode: a.coupon.code } }), 1);
  assert.equal((await prisma.coupon.findUnique({ where: { id: a.coupon.id } })).usedCount, 1);
  assert.equal((await prisma.product.findUnique({ where: { id: a.product.id } })).stock, 0);
  assert.deepEqual(await orderPaymentCounts(a), { orders: 1, payments: 1 });
  assert.deepEqual(await orderPaymentCounts({ ...b, gateway: gatewayB }), { orders: 0, payments: 0 });
  const eventRows = await prisma.razorpayWebhookEvent.findMany({ where: { eventId: { in: [`evt-stock-${a.id}`, `evt-stock-${b.id}`] } } });
  for (const row of eventRows) owned.events.push(row.id);
  assert.equal(eventRows.length, 2);
  assert.equal(eventRows.filter((row) => row.status === "PROCESSED").length, 1);
  assert.equal(eventRows.filter((row) => row.status === "RECOVERY_REQUIRED").length, 1);
});

test("two captured checkouts competing for the last stock unit produce one order and one review case", async () => {
  const a = await makeFixture({ stock: 1 });
  const b = await makeFixture({ stock: 1 });
  await prisma.razorpayCheckout.update({ where: { id: b.intent.id }, data: {
    snapshot: { ...b.intent.snapshot, items: [{ productId: a.product.id, variantId: null, quantity: 1 }] },
  } });
  const serviceB = createCheckoutRecoveryService({ prisma, validateCouponForOrder: createCouponValidator(prisma) });
  const providerA = gateProvider(a.gateway.provider, 2);
  const providerB = gateProvider(b.gateway.provider, 2);
  const handlerA = makeHandler({ provider: providerA, recovery: a.recovery });
  const handlerB = makeHandler({ provider: providerB, recovery: serviceB });
  await Promise.all([
    handlerA(signedRequest(`evt-last-stock-a-${a.id}`, capturedBody(a.gateway.order.id, a.gateway.payment.id))),
    handlerB(signedRequest(`evt-last-stock-b-${b.id}`, capturedBody(b.gateway.order.id, b.gateway.payment.id))),
  ]);
  assert.equal((await prisma.product.findUnique({ where: { id: a.product.id } })).stock, 0);
  const countsA = await orderPaymentCounts(a);
  const countsB = await orderPaymentCounts(b);
  const totalOrders = countsA.orders + countsB.orders;
  const totalPayments = countsA.payments + countsB.payments;
  assert.equal(totalOrders, 1, "Exactly one order must be created across both checkouts");
  assert.equal(totalPayments, 1, "Exactly one payment must be created across both checkouts");
  assert.ok(
    (countsA.orders === 1 && countsA.payments === 1 && countsB.orders === 0 && countsB.payments === 0) ||
    (countsA.orders === 0 && countsA.payments === 0 && countsB.orders === 1 && countsB.payments === 1),
    "Either checkout A or checkout B must win completely, never a split"
  );
  const states = await prisma.razorpayCheckout.findMany({ where: { id: { in: [a.intent.id, b.intent.id] } }, select: { status: true } });
  assert.equal(states.filter((row) => row.status === "FINALIZED").length, 1);
  assert.equal(states.filter((row) => row.status === "RECOVERY_REQUIRED").length, 1);
  const events = await prisma.razorpayWebhookEvent.findMany({ where: { eventId: { in: [`evt-last-stock-a-${a.id}`, `evt-last-stock-b-${b.id}`] } } });
  for (const row of events) owned.events.push(row.id);
  assert.equal(events.filter((row) => row.status === "PROCESSED").length, 1);
  assert.equal(events.filter((row) => row.status === "RECOVERY_REQUIRED").length, 1);
});

test("injected failure after order and payment writes rolls back coupon and inventory, then retries once", async () => {
  const f = await makeFixture({ coupon: true });
  const failing = createCheckoutRecoveryService({ prisma, validateCouponForOrder: createCouponValidator(prisma), hooks: { afterOrderCreated: () => { throw new Error("injected rollback"); } } });
  const handler = makeHandler({ provider: f.gateway.provider, recovery: failing });
  const eventId = `evt-rollback-${f.id}`;
  const body = capturedBody(f.gateway.order.id, f.gateway.payment.id);
  await handler(signedRequest(eventId, body));
  assert.deepEqual(await orderPaymentCounts(f), { orders: 0, payments: 0 });
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 8);
  assert.equal((await prisma.coupon.findUnique({ where: { id: f.coupon.id } })).usedCount, 0);
  const event = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId } }); owned.events.push(event.id);
  assert.equal(event.status, "RETRY");
  const retry = makeHandler({ provider: f.gateway.provider, recovery: f.recovery });
  await retry(signedRequest(eventId, body));
  assert.deepEqual(await orderPaymentCounts(f), { orders: 1, payments: 1 });
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 7);
  assert.equal((await prisma.coupon.findUnique({ where: { id: f.coupon.id } })).usedCount, 1);
  await assertPaymentIdentity(f);
  assert.equal((await prisma.razorpayWebhookEvent.findUnique({ where: { id: event.id } })).status, "PROCESSED");
});

test("replay after a finalized order was deleted does not recreate order/payment or repeat effects", async () => {
  const f = await makeFixture({ coupon: true });
  const handler = makeHandler({ provider: f.gateway.provider, recovery: f.recovery });
  const eventId = `evt-deleted-${f.id}`; const body = capturedBody(f.gateway.order.id, f.gateway.payment.id);
  await handler(signedRequest(eventId, body));
  const intent = await prisma.razorpayCheckout.findUnique({ where: { id: f.intent.id } });
  await prisma.order.delete({ where: { id: intent.orderId } });
  assert.equal((await prisma.razorpayCheckout.findUnique({ where: { id: f.intent.id } })).orderId, null);
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 7);
  assert.equal((await prisma.coupon.findUnique({ where: { id: f.coupon.id } })).usedCount, 1);
  await handler(signedRequest(`evt-deleted-replay-${f.id}`, body));
  const checkout = await prisma.razorpayCheckout.findUnique({ where: { id: f.intent.id } });
  const replayEvent = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId: `evt-deleted-replay-${f.id}` } });
  owned.events.push(replayEvent.id);
  assert.equal(checkout.status, "FINALIZED"); assert.equal(checkout.orderId, null);
  assert.match(checkout.recoveryReason ?? "", /FINALIZED_ORDER_MISSING/);
  assert.equal(replayEvent.status, "RECOVERY_REQUIRED");
  assert.deepEqual(await orderPaymentCounts(f), { orders: 0, payments: 0 });
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 7);
  assert.equal((await prisma.coupon.findUnique({ where: { id: f.coupon.id } })).usedCount, 1);
});

test("each saved pricing component mismatch remains in recovery even when subtotal arithmetic is unchanged", async () => {
  for (const key of ["subtotal", "discountAmount", "shippingCharge", "giftWrapCharge", "totalAmount"]) {
    const f = await makeFixture({ coupon: true });
    const saved = { ...f.intent.snapshot.pricing };
    const deltas = { subtotal: [1, -1], discountAmount: [1, 1], shippingCharge: [1, -1], giftWrapCharge: [1, 0], totalAmount: [1, 0] };
    saved[key] += deltas[key][0];
    const offsetKey = key === "subtotal" ? "discountAmount" : key === "discountAmount" ? "subtotal" : key === "shippingCharge" ? "giftWrapCharge" : key === "giftWrapCharge" ? "subtotal" : null;
    if (offsetKey) saved[offsetKey] += deltas[key][1];
    await prisma.razorpayCheckout.update({ where: { id: f.intent.id }, data: { snapshot: { ...f.intent.snapshot, pricing: saved } } });
    const handler = makeHandler({ provider: f.gateway.provider, recovery: f.recovery });
    const eventId = `evt-price-${key}-${f.id}`;
    await handler(signedRequest(eventId, capturedBody(f.gateway.order.id, f.gateway.payment.id)));
    const event = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId } }); owned.events.push(event.id);
    assert.equal(event.status, "RECOVERY_REQUIRED", key);
    assert.equal((await prisma.razorpayCheckout.findUnique({ where: { id: f.intent.id } })).status, "RECOVERY_REQUIRED", key);
    assert.deepEqual(await orderPaymentCounts(f), { orders: 0, payments: 0 }, key);
    assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 8, key);
    assert.equal((await prisma.coupon.findUnique({ where: { id: f.coupon.id } })).usedCount, 0, key);
  }
});

test("expired lease is reclaimed with a fresh fence; prior token cannot renew or complete", async () => {
  const f = await makeFixture();
  const eventId = `evt-lease-${f.id}`;
  const body = capturedBody(f.gateway.order.id, f.gateway.payment.id);
  const event = await prisma.razorpayWebhookEvent.create({ data: { eventId, eventType: "payment.captured", orderId: f.gateway.order.id, paymentId: f.gateway.payment.id, payloadHash: createHash(body), status: "PROCESSING", attempts: 1, claimToken: `old-${f.id}`, lockUntil: new Date(Date.now() - 60_000) } });
  owned.events.push(event.id);
  let release;
  const paused = new Promise((resolve) => { release = resolve; });
  let entered;
  const atClaim = new Promise((resolve) => { entered = resolve; });
  const handler = makeHandler({ provider: f.gateway.provider, recovery: f.recovery, tokens: [`new-${f.id}`], hooks: { afterClaim: async () => { entered(); await paused; } } });
  const running = handler(signedRequest(eventId, body));
  await atClaim;
  const claimed = await prisma.razorpayWebhookEvent.findUnique({ where: { id: event.id } });
  assert.equal(claimed.claimToken, `new-${f.id}`); assert.equal(claimed.attempts, 2);
  release();
  const response = await running;
  assert.equal(response.status, 200);
  const completed = await prisma.razorpayWebhookEvent.findUnique({ where: { id: event.id } });
  assert.equal(completed.status, "PROCESSED"); assert.equal(completed.claimToken, null);
});

test("a worker paused during provider verification loses renewal after a newer claim takes over", async () => {
  const f = await makeFixture();
  const eventId = `evt-renew-takeover-${f.id}`; const body = capturedBody(f.gateway.order.id, f.gateway.payment.id);
  let releaseA; const pauseA = new Promise((resolve) => { releaseA = resolve; });
  let enteredA; const atA = new Promise((resolve) => { enteredA = resolve; });
  const handlerA = makeHandler({ provider: f.gateway.provider, recovery: f.recovery, tokens: [`claim-old-${f.id}`], hooks: { afterProviderVerification: async () => { enteredA(); await pauseA; } } });
  const responseA = handlerA(signedRequest(eventId, body));
  await atA;
  const event = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId } }); owned.events.push(event.id);
  await prisma.razorpayWebhookEvent.update({ where: { id: event.id }, data: { lockUntil: new Date(Date.now() - 60_000) } });
  const handlerB = makeHandler({ provider: f.gateway.provider, recovery: f.recovery, tokens: [`claim-new-${f.id}`] });
  assert.equal((await handlerB(signedRequest(eventId, body))).status, 200);
  releaseA();
  assert.equal((await responseA).status, 503);
  const current = await prisma.razorpayWebhookEvent.findUnique({ where: { id: event.id } });
  assert.equal(current.status, "PROCESSED"); assert.equal(current.claimToken, null);
  assert.deepEqual(await orderPaymentCounts(f), { orders: 1, payments: 1 });
  await assertPaymentIdentity(f);
});

test("worker losing lease during finalization cannot complete stale claim; newer worker recovers idempotently", async () => {
  const f = await makeFixture({ coupon: true });
  const eventId = `evt-finalize-lease-${f.id}`;
  const body = capturedBody(f.gateway.order.id, f.gateway.payment.id);
  let releaseA; const pauseA = new Promise((resolve) => { releaseA = resolve; });
  let enteredA; const atA = new Promise((resolve) => { enteredA = resolve; });
  const finalizingRecovery = createCheckoutRecoveryService({
    prisma, validateCouponForOrder: createCouponValidator(prisma),
    hooks: { afterOrderCreated: async () => { enteredA(); await pauseA; } },
  });
  const handlerA = makeHandler({ provider: f.gateway.provider, recovery: finalizingRecovery, tokens: [`claim-a-${f.id}`] });
  const responseA = handlerA(signedRequest(eventId, body));
  await atA;
  const event = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId } }); owned.events.push(event.id);
  await prisma.razorpayWebhookEvent.update({ where: { id: event.id }, data: { lockUntil: new Date(Date.now() - 60_000) } });
  let releaseB; const pauseB = new Promise((resolve) => { releaseB = resolve; });
  let enteredB; const atB = new Promise((resolve) => { enteredB = resolve; });
  const handlerB = makeHandler({ provider: f.gateway.provider, recovery: f.recovery, tokens: [`claim-b-${f.id}`], hooks: { afterClaim: async () => { enteredB(); await pauseB; } } });
  const responseB = handlerB(signedRequest(eventId, body));
  await atB;
  releaseA();
  const stale = await responseA;
  assert.equal(stale.status, 503);
  releaseB();
  assert.equal((await responseB).status, 200);
  assert.deepEqual(await orderPaymentCounts(f), { orders: 1, payments: 1 });
  await assertPaymentIdentity(f);
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 7);
  assert.equal((await prisma.coupon.findUnique({ where: { id: f.coupon.id } })).usedCount, 1);
  const finalEvent = await prisma.razorpayWebhookEvent.findUnique({ where: { id: event.id } });
  assert.equal(finalEvent.status, "PROCESSED"); assert.equal(finalEvent.claimToken, null);
});

function createHash(body) {
  return digestHash("sha256").update(JSON.stringify(body)).digest("hex");
}
