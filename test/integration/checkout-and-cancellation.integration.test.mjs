import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { registerHooks } from "node:module";
import { PrismaClient } from "@prisma/client";
import { couponUsageLockKeys, customerOrderLockKeys, withCouponUsageLocks } from "@/lib/coupon-checkout";
import { checkoutIdempotencyDisposition, checkoutRequestFingerprint } from "@/lib/checkout-idempotency";
import { createCustomerOrderActions } from "@/lib/customer-order-actions";
import { persistOrderStatusTransition } from "@/lib/admin-order-transition";
import { canAdminCancelOrder } from "@/lib/order-status";
import { createInquiryPostHandler, loadCustomerInquiries } from "@/lib/customer-inquiries";
import { createAdminReturnRequestHandlers } from "@/lib/admin-return-requests";
import { loadCustomerOrderHistory } from "@/lib/customer-order-history";
import { withAdminCapability } from "@/lib/admin-api-access";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required; application database variables are never used.");
const target = new URL(databaseUrl);
const databaseName = decodeURIComponent(target.pathname.replace(/^\//, ""));
if (!new Set(["postgres:", "postgresql:"]).has(target.protocol) ||
    ((target.searchParams.has("schema") && target.searchParams.get("schema") !== "public") || target.searchParams.has("options")) ||
    !new Set(["localhost", "127.0.0.1", "::1", "[::1]"]).has(target.hostname.toLowerCase()) ||
    !databaseName.startsWith("preheritage_razorpay_it_") || process.env.CONFIRM_TEST_DATABASE_NAME !== databaseName) {
  throw new Error("Integration tests require the confirmed loopback preheritage_razorpay_it_ database.");
}

// The HTTP route uses the application Prisma singleton. Bind that singleton
// explicitly to the already-verified test target before importing the route.
process.env.DATABASE_URL = databaseUrl;
process.env.NEXTAUTH_SECRET = "preheritage-local-checkout-integration-only";
process.env.RESEND_API_KEY = "";
process.env.RESEND_FROM_EMAIL = "";
// COD route tests use guest checkout; keep auth infrastructure out of this
// integration's scope while exercising the real route and database writes.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/account-auth") {
      return { url: "data:text/javascript,export%20async%20function%20getCustomerUser()%7Breturn%20null%7D", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { POST: checkoutPost } = await import("@/app/api/checkout/route");
const { createCheckoutConfirmationToken } = await import("@/lib/checkout-confirmation");
const { default: routePrisma } = await import("@/lib/prisma");

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const owned = { users: [], orders: [], products: [], coupons: [], categories: [], tickets: [] };
let identityVerified = false;

async function verifyTarget() {
  const currentUrl = process.env.TEST_DATABASE_URL;
  if (!currentUrl || currentUrl !== databaseUrl || process.env.CONFIRM_TEST_DATABASE_NAME !== databaseName) {
    throw new Error("Refusing integration fixture operation: confirmed test database configuration changed.");
  }
  const current = new URL(currentUrl);
  const currentName = decodeURIComponent(current.pathname.replace(/^\//, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(current.protocol) ||
      ((current.searchParams.has("schema") && current.searchParams.get("schema") !== "public") || current.searchParams.has("options")) ||
      !new Set(["localhost", "127.0.0.1", "::1", "[::1]"]).has(current.hostname.toLowerCase()) ||
      currentName !== databaseName || !currentName.startsWith("preheritage_razorpay_it_")) {
    throw new Error("Refusing integration fixture operation: confirmed disposable target changed.");
  }
  const rows = await prisma.$queryRaw`SELECT current_database() AS name`;
  if (rows.length !== 1 || rows[0].name !== databaseName) throw new Error("Connected database identity does not match the confirmed disposable target.");
  const routeRows = await routePrisma.$queryRaw`SELECT current_database() AS name`;
  if (routeRows.length !== 1 || routeRows[0].name !== databaseName) throw new Error("Checkout route Prisma client is not connected to the confirmed disposable target.");
}

before(async () => {
  await verifyTarget();
  identityVerified = true;
});

after(async () => {
  try {
    if (!identityVerified) return;
    if (owned.tickets.length) { await verifyTarget(); await prisma.supportTicket.deleteMany({ where: { id: { in: owned.tickets } } }); }
    if (owned.orders.length) { await verifyTarget(); await prisma.order.deleteMany({ where: { id: { in: owned.orders } } }); }
    if (owned.coupons.length) { await verifyTarget(); await prisma.coupon.deleteMany({ where: { id: { in: owned.coupons } } }); }
    if (owned.products.length) { await verifyTarget(); await prisma.product.deleteMany({ where: { id: { in: owned.products } } }); }
    if (owned.categories.length) { await verifyTarget(); await prisma.category.deleteMany({ where: { id: { in: owned.categories } } }); }
    if (owned.users.length) { await verifyTarget(); await prisma.user.deleteMany({ where: { id: { in: owned.users } } }); }
  } finally {
    await prisma.$disconnect();
  }
});

function barrier(parties) {
  let count = 0;
  let open;
  const gate = new Promise((resolve) => { open = resolve; });
  return async () => { count += 1; if (count === parties) open(); await gate; };
}

async function fixture({ stock = 8, customer = false } = {}) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 14);
  const category = await prisma.category.create({ data: { name: `IT ${suffix}`, slug: `it-${suffix}` } });
  owned.categories.push(category.id);
  const product = await prisma.product.create({ data: {
    title: `Integration item ${suffix}`, slug: `integration-item-${suffix}`, sku: `IT-${suffix}`,
    description: "Disposable integration fixture", price: 100, mrp: 100, categoryId: category.id, stock,
  } });
  owned.products.push(product.id);
  const email = `checkout-${suffix}@example.test`;
  const user = customer ? await prisma.user.create({ data: { name: "Integration Customer", email } }) : null;
  if (user) owned.users.push(user.id);
  return { suffix, product, email, user };
}

test("inquiry handler persists only trusted fields and customer status query returns only the owner’s tickets", async () => {
  const f = await fixture({ customer: true });
  const handler = createInquiryPostHandler({ store: prisma, getCustomer: async () => ({ id: f.user.id }) });
  const response = await handler(new Request("http://localhost/api/inquiries", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      name: "Integration Customer", email: f.email.toUpperCase(), phone: "+91 98765 43210",
      subject: "Order status inquiry", message: "Please let me know the status of my order.",
      userId: "another-user", status: "RESOLVED", category: "ORDER", orderId: "another-order", adminNotes: "forged",
    }),
  }));
  const responseBody = await response.json();
  assert.equal(response.status, 201);
  assert.equal(responseBody.success, true);
  owned.tickets.push(responseBody.id);
  const persisted = await prisma.supportTicket.findUnique({ where: { id: responseBody.id }, select: {
    userId: true, guestName: true, guestEmail: true, guestPhone: true, subject: true, message: true, category: true, status: true,
  } });
  assert.deepEqual(persisted, {
    userId: f.user.id, guestName: "Integration Customer", guestEmail: f.email,
    guestPhone: "+91 98765 43210", subject: "Order status inquiry",
    message: "Please let me know the status of my order.", category: "GENERAL", status: "OPEN",
  });

  const other = await prisma.user.create({ data: { name: "Other Integration User", email: `other-${f.suffix}@example.test` } });
  owned.users.push(other.id);
  const otherTicket = await prisma.supportTicket.create({ data: {
    userId: other.id, guestName: other.name, guestEmail: other.email,
    subject: "Other customer inquiry", message: "This belongs to another customer.", category: "GENERAL", status: "IN_PROGRESS",
  }, select: { id: true } });
  owned.tickets.push(otherTicket.id);
  const visible = await loadCustomerInquiries(prisma, f.user.id);
  assert.equal(visible.status, "loaded");
  assert.deepEqual(visible.inquiries.map(({ id, subject, status }) => ({ id, subject, status })), [
    { id: responseBody.id, subject: "Order status inquiry", status: "OPEN" },
  ]);
});

function checkoutPayload(f, overrides = {}) {
  const customer = {
    fullName: "Integration Guest", email: f.email, phone: "9876543210",
    houseFlat: "12 Test Lane", area: "Test Area", landmark: "", city: "Jaipur",
    state: "Rajasthan", pincode: "302001", country: "India",
  };
  const items = [{ productId: f.product.id, variantId: null, quantity: 1, price: Number(f.product.price) }];
  return {
    customer, items, paymentMethod: "COD", deliveryMethod: "standard", giftWrapFee: 0,
    couponCode: null, checkoutIdempotencyKey: randomUUID(),
    subtotal: Number(f.product.price), discountAmount: 0, shippingFee: 250,
    codFee: 150, grandTotal: Number(f.product.price) + 400,
    ...overrides,
  };
}

async function postCheckout(payload) {
  return checkoutPost(new Request("http://localhost/api/checkout", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
  }));
}

async function confirmInitialQuote(f, payload = checkoutPayload(f)) {
  const response = await postCheckout({ ...payload, grandTotal: 0 });
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.code, "PRICE_CHANGED");
  assert.equal(typeof body.confirmationToken, "string");
  return { payload, quote: body };
}

function routeConfirmationContext(payload) {
  const customer = payload.customer;
  return {
    couponCode: payload.couponCode,
    deliveryMethod: payload.deliveryMethod,
    customerIdentity: JSON.stringify({
      userId: null,
      email: String(customer.email).trim().toLowerCase(),
      fullName: String(customer.fullName).trim(),
      phone: String(customer.phone).trim(),
      houseFlat: String(customer.houseFlat).trim(),
      area: String(customer.area).trim(),
      landmark: String(customer.landmark ?? "").trim(),
      city: String(customer.city).trim(),
      state: String(customer.state).trim(),
      pincode: String(customer.pincode).trim(),
      country: String(customer.country ?? "India").trim(),
    }),
    checkoutIdempotencyKey: payload.checkoutIdempotencyKey,
  };
}

async function ownResponseOrder(response) {
  const body = await response.clone().json();
  if (typeof body.orderId === "string") owned.orders.push(body.orderId);
  return body;
}

async function createCoupon(f, { firstOrderOnly = true } = {}) {
  const coupon = await prisma.coupon.create({ data: {
    code: `IT${f.suffix}${owned.coupons.length}`.toUpperCase(), discountType: "FIXED", discountValue: 10,
    minOrderValue: 0, usageLimit: 10, usagePerUser: 1, firstOrderOnly,
    startDate: new Date(Date.now() - 60_000), endDate: new Date(Date.now() + 86_400_000), isActive: true,
  } });
  owned.coupons.push(coupon.id);
  return coupon;
}

async function createOrder(f, { couponCode = null, userId = f.user?.id ?? null, email = f.email,
  paymentStatus = "PENDING", status = "PLACED", idempotencyKey = null, fingerprint = null, quantity = 1 } = {}, db = prisma) {
  const order = await db.order.create({ data: {
    orderNumber: `PRE-IT-${randomUUID()}`, ...(idempotencyKey ? { checkoutIdempotencyKey: idempotencyKey, checkoutRequestFingerprint: fingerprint } : {}),
    userId, guestEmail: email, subtotal: 100 * quantity, discountAmount: couponCode ? 10 : 0,
    couponCode, shippingCharge: 0, totalAmount: 100 * quantity - (couponCode ? 10 : 0),
    paymentMethod: "COD", paymentStatus, status,
    items: { create: { productId: f.product.id, title: "Integration item", sku: f.product.sku,
      price: 100, quantity, totalPrice: 100 * quantity } },
    timeline: { create: { status, title: "Order Placed", description: "Integration fixture." } },
    payment: { create: { method: "COD", status: paymentStatus, amount: 100 * quantity - (couponCode ? 10 : 0), currency: "INR" } },
  } });
  owned.orders.push(order.id);
  return order;
}

async function lockCustomerAndCoupon(tx, { userId, email, couponCode }) {
  const keys = [
    ...customerOrderLockKeys({ userId, email }),
    ...(couponCode ? couponUsageLockKeys({ couponCode, userId, email }) : []),
  ];
  await withCouponUsageLocks(keys, async (key) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0)) IS NULL AS locked`;
  }, async () => {});
}

async function createUnderFirstOrderRules(f, coupon, ready = async () => {}) {
  return prisma.$transaction(async (tx) => {
    await ready();
    await lockCustomerAndCoupon(tx, { userId: f.user?.id, email: f.email, couponCode: coupon?.code });
    const identityFilter = [
      ...(f.user?.id ? [{ userId: f.user.id }] : []),
      { guestEmail: f.email.toLowerCase() },
    ];
    if (coupon?.firstOrderOnly && await tx.order.count({ where: { OR: identityFilter } })) return { qualified: false };
    if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    const order = await createOrder(f, { couponCode: coupon?.code ?? null }, tx);
    return { qualified: true, orderId: order.id };
  });
}

test("different first-order coupon codes serialize on one customer key", async () => {
  const f = await fixture({ customer: true });
  const couponA = await createCoupon(f);
  const couponB = await createCoupon(f);
  const bothReady = barrier(2);
  const results = await Promise.all([
    createUnderFirstOrderRules(f, couponA, bothReady),
    createUnderFirstOrderRules(f, couponB, bothReady),
  ]);
  assert.equal(results.filter((result) => result.qualified).length, 1);
  assert.equal(await prisma.order.count({ where: { OR: [{ userId: f.user.id }, { guestEmail: f.email }] } }), 1);
  assert.equal((await prisma.coupon.findMany({ where: { id: { in: [couponA.id, couponB.id] } } })).reduce((sum, row) => sum + row.usedCount, 0), 1);
});

test("a competing no-coupon order participates in first-order serialization", async () => {
  const f = await fixture({ customer: true });
  const coupon = await createCoupon(f);
  let releaseFirst;
  const allowFirstCommit = new Promise((resolve) => { releaseFirst = resolve; });
  let signalFirst;
  const firstHasLock = new Promise((resolve) => { signalFirst = resolve; });
  // Use a transaction held after the customer lock to make the ordering deterministic.
  const firstOrdinary = prisma.$transaction(async (tx) => {
    await lockCustomerAndCoupon(tx, { userId: f.user.id, email: f.email, couponCode: null });
    signalFirst();
    await allowFirstCommit;
    const order = await createOrder(f, { couponCode: null }, tx);
    return { qualified: true, orderId: order.id };
  });
  await firstHasLock;
  const discounted = createUnderFirstOrderRules(f, coupon);
  releaseFirst();
  const [normalResult, couponResult] = await Promise.all([firstOrdinary, discounted]);
  assert.equal(normalResult.qualified, true);
  assert.equal(couponResult.qualified, false);
  assert.equal(await prisma.order.count({ where: { OR: [{ userId: f.user.id }, { guestEmail: f.email }] } }), 1);
  assert.equal((await prisma.coupon.findUnique({ where: { id: coupon.id } })).usedCount, 0);
});

test("concurrent same-key checkout inserts return one order and roll back duplicate inventory decrement", async () => {
  const f = await fixture({ stock: 5 });
  const idempotencyKey = randomUUID();
  const fingerprint = checkoutRequestFingerprint({
    customer: { fullName: "Integration Guest", email: f.email },
    items: [{ productId: f.product.id, quantity: 1 }], deliveryMethod: "standard", giftWrap: false,
  });
  const bothReady = barrier(2);
  async function attempt() {
    try {
      return await prisma.$transaction(async (tx) => {
        await bothReady();
        await lockCustomerAndCoupon(tx, { userId: null, email: f.email, couponCode: null });
        const stock = await tx.product.updateMany({ where: { id: f.product.id, stock: { gte: 1 } }, data: { stock: { decrement: 1 } } });
        assert.equal(stock.count, 1);
        return createOrder(f, { idempotencyKey, fingerprint }, tx);
      });
    } catch (error) {
      if (error?.code !== "P2002") throw error;
      const existing = await prisma.order.findUnique({ where: { checkoutIdempotencyKey: idempotencyKey } });
      assert.equal(checkoutIdempotencyDisposition(existing, { userId: null, email: f.email }, fingerprint), "replay");
      return existing;
    }
  }
  const [a, b] = await Promise.all([attempt(), attempt()]);
  assert.equal(a.id, b.id);
  assert.equal(await prisma.order.count({ where: { checkoutIdempotencyKey: idempotencyKey } }), 1);
  assert.equal(await prisma.payment.count({ where: { orderId: a.id } }), 1);
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 4);
});


test("competing checkout stock updates cannot oversell", async () => {
  const f = await fixture({ stock: 1 });
  const bothReady = barrier(2);

  const identities = [
    `buyer-1-${f.email}`,
    `buyer-2-${f.email}`,
  ];

  async function attempt(identity) {
    return prisma.$transaction(async (tx) => {
      await bothReady();

      await lockCustomerAndCoupon(tx, {
        userId: null,
        email: identity,
        couponCode: null,
      });

      const stock = await tx.product.updateMany({
        where: {
          id: f.product.id,
          stock: { gte: 1 },
        },
        data: {
          stock: { decrement: 1 },
        },
      });

      if (stock.count !== 1) return false;

      await createOrder(f, { email: identity }, tx);
      return true;
    });
  }

  const results = await Promise.all(identities.map(attempt));

  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(results.filter((result) => !result).length, 1);

  const product = await prisma.product.findUnique({
    where: { id: f.product.id },
  });

  assert.equal(product.stock, 0);

  const orderCount = await prisma.order.count({
    where: {
      guestEmail: { in: identities },
    },
  });

  assert.equal(orderCount, 1);
});

test("checkout rolls back earlier item stock and all order records when a later guarded stock update fails", async () => {
  const first = await fixture({ stock: 4 });
  const second = await fixture({ stock: 3 });
  const coupon = await createCoupon(first, { firstOrderOnly: false });
  const payload = checkoutPayload(first, {
    customer: { ...checkoutPayload(first).customer, email: first.email },
    items: [
      { productId: first.product.id, variantId: null, quantity: 2, price: Number(first.product.price) },
      { productId: second.product.id, variantId: null, quantity: 1, price: Number(second.product.price) },
    ],
    couponCode: coupon.code, subtotal: 300, discountAmount: 10, grandTotal: 690,
  });
  // The initial read sees both items in stock. A competing buyer exhausts the
  // later line after the first guarded decrement has run inside checkout's tx.
  let raced = false;
  routePrisma.$use(async (params, next) => {
    if (!raced && params.model === "Product" && params.action === "updateMany" && params.args?.where?.id === second.product.id) {
      raced = true;
      await prisma.product.update({ where: { id: second.product.id }, data: { stock: 0 } });
    }
    return next(params);
  });
  const originalError = console.error;
  console.error = () => {};
  let response;
  try { response = await postCheckout(payload); } finally { console.error = originalError; }
  const body = await response.json();
  assert.equal(raced, true, `Expected the later-item race hook; got HTTP ${response.status} (${body.code ?? "no code"}: ${body.message ?? "no message"}; quote ${JSON.stringify(body.pricing ?? null)}).`);
  assert.equal(response.status, 409);
  assert.equal(body.code, "STOCK_CONFLICT");
  assert.equal(typeof body.message, "string");
  assert.equal(await prisma.order.count({ where: { guestEmail: first.email } }), 0);
  assert.equal(await prisma.orderItem.count({ where: { order: { guestEmail: first.email } } }), 0);
  assert.equal(await prisma.orderTimeline.count({ where: { order: { guestEmail: first.email } } }), 0);
  assert.equal(await prisma.payment.count({ where: { order: { guestEmail: first.email } } }), 0);
  assert.equal((await prisma.product.findUnique({ where: { id: first.product.id } })).stock, 4);
  // This is the simulated competing buyer's write, not a checkout decrement.
  assert.equal((await prisma.product.findUnique({ where: { id: second.product.id } })).stock, 0);
  assert.equal((await prisma.coupon.findUnique({ where: { id: coupon.id } })).usedCount, 0);
});

test("checkout HTTP route accepts a valid quote token and same-key retry replays one order", async () => {
  const f = await fixture({ stock: 3 });
  const { payload, quote } = await confirmInitialQuote(f);
  const confirmed = { ...payload, confirmedPricingToken: quote.confirmationToken };
  const firstResponse = await postCheckout(confirmed);
  const firstBody = await ownResponseOrder(firstResponse);
  assert.equal(firstResponse.status, 200);
  assert.equal(firstBody.success, true);
  assert.equal(typeof firstBody.orderId, "string");

  const replayResponse = await postCheckout(confirmed);
  const replayBody = await replayResponse.json();
  assert.equal(replayResponse.status, 200);
  assert.equal(replayBody.success, true);
  assert.equal(replayBody.replay, true);
  assert.equal(replayBody.orderId, firstBody.orderId);
  assert.equal(await prisma.order.count({ where: { checkoutIdempotencyKey: payload.checkoutIdempotencyKey } }), 1);
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 2);
});

test("checkout HTTP route rejects expired and context-changed confirmation tokens", async () => {
  const cases = ["expired", "cart", "customer", "coupon", "delivery", "idempotency"];
  for (const change of cases) {
    const f = await fixture({ stock: 5 });
    const initial = checkoutPayload(f);
    const { quote } = await confirmInitialQuote(f, initial);
    let submitted = { ...initial, confirmedPricingToken: quote.confirmationToken };

    if (change === "expired") {
      submitted.confirmedPricingToken = createCheckoutConfirmationToken({
        pricing: quote.pricing,
        context: routeConfirmationContext(initial),
        secret: process.env.NEXTAUTH_SECRET,
        now: Date.now() - 15 * 60 * 1000 - 1,
      });
    } else if (change === "cart") {
      submitted.items = [{ ...initial.items[0], quantity: 2 }];
      submitted.subtotal = 200;
      submitted.grandTotal = 600;
    } else if (change === "customer") {
      submitted.customer = { ...initial.customer, fullName: "Changed Integration Guest" };
    } else if (change === "coupon") {
      const coupon = await createCoupon(f, { firstOrderOnly: false });
      submitted.couponCode = coupon.code;
    } else if (change === "delivery") {
      submitted.deliveryMethod = "express";
      submitted.shippingFee = 499;
      submitted.grandTotal = Number(f.product.price) + 649;
    } else if (change === "idempotency") {
      submitted.checkoutIdempotencyKey = randomUUID();
    }

    const response = await postCheckout(submitted);
    const body = await response.json();
    assert.equal(response.status, 409, change);
    assert.equal(body.code, "PRICE_CHANGED", change);
    assert.equal(typeof body.confirmationToken, "string", change);
    assert.equal(await prisma.order.count({ where: { guestEmail: initial.customer.email } }), 0, change);
    assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 5, change);
  }
});

test("a database quote change invalidates confirmation and the refreshed quote requires another submit", async () => {
  const f = await fixture({ stock: 3 });
  const { payload, quote } = await confirmInitialQuote(f);
  await prisma.product.update({ where: { id: f.product.id }, data: { price: 125 } });

  const staleResponse = await postCheckout({ ...payload, confirmedPricingToken: quote.confirmationToken });
  const staleBody = await staleResponse.json();
  assert.equal(staleResponse.status, 409);
  assert.equal(staleBody.code, "PRICE_CHANGED");
  assert.equal(staleBody.pricing.items[0].price, 125);
  assert.equal(await prisma.order.count({ where: { guestEmail: f.email } }), 0);
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 3);

  const finalResponse = await postCheckout({ ...payload, confirmedPricingToken: staleBody.confirmationToken });
  const finalBody = await ownResponseOrder(finalResponse);
  assert.equal(finalResponse.status, 200);
  assert.equal(finalBody.success, true);
  assert.equal(await prisma.order.count({ where: { checkoutIdempotencyKey: payload.checkoutIdempotencyKey } }), 1);
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 2);
});


test("admin unpaid cancellation restores stock once and writes one timeline transition", async () => {
  const f = await fixture({ stock: 3 });
  const order = await createOrder(f, { quantity: 2 });
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id }, select: { productId: true, variantId: true, quantity: true } });
  assert.equal(canAdminCancelOrder(order.status, order.paymentStatus), true);
  const transition = (tx, cancellationItems = items) => persistOrderStatusTransition(tx, {
    orderId: order.id, expectedStatus: order.status, expectedPaymentStatus: order.paymentStatus,
    nextStatus: "CANCELLED", cancellationItems, updateData: { status: "CANCELLED", cancelledAt: new Date() },
  });
  const updated = await prisma.$transaction((tx) => transition(tx));
  assert.equal(updated.status, "CANCELLED");
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 5);
  assert.equal(await prisma.orderTimeline.count({ where: { orderId: order.id, status: "CANCELLED" } }), 1);
  assert.equal(await prisma.$transaction((tx) => transition(tx)), null);
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 5);
  assert.equal(await prisma.orderTimeline.count({ where: { orderId: order.id, status: "CANCELLED" } }), 1);
});

test("paid admin cancellation is rejected and a late restock failure rolls back status, stock, and timeline", async () => {
  const f = await fixture({ stock: 3 });
  const paidOrder = await createOrder(f, { paymentStatus: "SUCCESS" });
  assert.equal(canAdminCancelOrder(paidOrder.status, paidOrder.paymentStatus), false);
  const paidResult = await prisma.$transaction((tx) => persistOrderStatusTransition(tx, {
    orderId: paidOrder.id, expectedStatus: paidOrder.status, expectedPaymentStatus: paidOrder.paymentStatus,
    nextStatus: "CANCELLED", cancellationItems: [], updateData: { status: "CANCELLED" },
  }));
  assert.equal(paidResult, null);
  assert.equal((await prisma.order.findUnique({ where: { id: paidOrder.id } })).status, "PLACED");

  const rollbackOrder = await createOrder(f, { paymentStatus: "PENDING" });
  const items = [
    { productId: f.product.id, variantId: null, quantity: 2 },
    { productId: `missing-${f.suffix}`, variantId: null, quantity: 1 },
  ];
  await assert.rejects(prisma.$transaction((tx) => persistOrderStatusTransition(tx, {
    orderId: rollbackOrder.id, expectedStatus: rollbackOrder.status, expectedPaymentStatus: rollbackOrder.paymentStatus,
    nextStatus: "CANCELLED", cancellationItems: items, updateData: { status: "CANCELLED" },
  })), /Could not restore cancelled order inventory/);
  assert.equal((await prisma.order.findUnique({ where: { id: rollbackOrder.id } })).status, "PLACED");
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 3);
  assert.equal(await prisma.orderTimeline.count({ where: { orderId: rollbackOrder.id, status: "CANCELLED" } }), 0);
});

test("customer cancellation and return requests enforce ownership, status, and item membership", async () => {
  const f = await fixture({ stock: 4, customer: true });
  const actions = createCustomerOrderActions(prisma);
  const cancellable = await createOrder(f, { quantity: 1 });
  assert.deepEqual(await actions.cancelOrder(null, cancellable.id), { status: "unauthorized" });
  assert.deepEqual(await actions.cancelOrder(`other-${f.user.id}`, cancellable.id), { status: "not-found" });
  assert.deepEqual(await actions.cancelOrder(f.user.id, cancellable.id), { status: "cancelled" });
  assert.equal((await prisma.product.findUnique({ where: { id: f.product.id } })).stock, 5);
  assert.equal(await prisma.orderTimeline.count({ where: { orderId: cancellable.id, status: "CANCELLED" } }), 1);

  const delivered = await createOrder(f, { status: "DELIVERED", paymentStatus: "SUCCESS" });
  const item = await prisma.orderItem.findFirst({ where: { orderId: delivered.id } });
  const request = { requestType: "RETURN", reason: "Changed mind", itemIds: [item.id] };
  assert.deepEqual(await actions.requestReturn(`other-${f.user.id}`, delivered.id, request), { status: "not-found" });
  assert.deepEqual(await actions.requestReturn(f.user.id, delivered.id, { ...request, itemIds: [`foreign-${item.id}`] }), { status: "invalid-items" });
  assert.equal((await actions.requestReturn(f.user.id, delivered.id, request)).status, "created");
  assert.deepEqual(await actions.requestReturn(f.user.id, delivered.id, request), { status: "duplicate" });
  const unshipped = await createOrder(f, { status: "PLACED" });
  assert.deepEqual(await actions.requestReturn(f.user.id, unshipped.id, request), { status: "ineligible" });
});

test("staff return review persists an audited status transition without exposing customer identity", async () => {
  const f = await fixture({ customer: true });
  const delivered = await createOrder(f, { status: "DELIVERED", paymentStatus: "SUCCESS" });
  const item = await prisma.orderItem.findFirst({ where: { orderId: delivered.id } });
  const created = await createCustomerOrderActions(prisma).requestReturn(f.user.id, delivered.id, {
    requestType: "RETURN", reason: "Changed mind", itemIds: [item.id],
  });
  assert.equal(created.status, "created");

  const audit = [];
  const handlers = createAdminReturnRequestHandlers({
    prisma,
    authorize: async (capability) => capability === "returns.manage"
      ? { admin: { id: `it-admin-${f.suffix}` }, status: 200 }
      : { admin: null, status: 403 },
    auditStore: {
      async begin(event) { audit.push({ phase: "begin", ...event }); return `return-audit-${f.suffix}`; },
      async finish(id, outcome, status) { audit.push({ phase: "finish", id, outcome, status }); },
    },
    wrap: withAdminCapability,
  });
  const listed = await handlers.GET(new Request("http://localhost/api/admin/returns"));
  assert.equal(listed.status, 200);
  const listedBody = await listed.json();
  const listedRequest = listedBody.requests.find((entry) => entry.id === created.request.id);
  assert.equal(listedRequest.orderNumber, delivered.orderNumber);
  assert.equal(listedRequest.requestedItems[0].title, item.title);
  assert.equal("userId" in listedRequest, false);

  const updated = await handlers.PATCH(new Request("http://localhost/api/admin/returns", {
    method: "PATCH", headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: created.request.id, expectedStatus: "REQUESTED", status: "APPROVED" }),
  }));
  assert.equal(updated.status, 200);
  assert.equal((await prisma.returnRequest.findUnique({ where: { id: created.request.id } })).status, "APPROVED");
  assert.equal(audit[0].adminId, `it-admin-${f.suffix}`);
  assert.equal(audit[1].outcome, "SUCCESS");

  const stale = await handlers.PATCH(new Request("http://localhost/api/admin/returns", {
    method: "PATCH", headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: created.request.id, expectedStatus: "REQUESTED", status: "REJECTED" }),
  }));
  assert.equal(stale.status, 409);
  assert.equal((await prisma.returnRequest.findUnique({ where: { id: created.request.id } })).status, "APPROVED");

  const rejectedOrder = await createOrder(f, { status: "DELIVERED", paymentStatus: "SUCCESS" });
  const rejectedItem = await prisma.orderItem.findFirst({ where: { orderId: rejectedOrder.id } });
  const rejectedRequest = await createCustomerOrderActions(prisma).requestReturn(f.user.id, rejectedOrder.id, {
    requestType: "RETURN", reason: "Changed mind", itemIds: [rejectedItem.id],
  });
  assert.equal(rejectedRequest.status, "created");
  const rejected = await handlers.PATCH(new Request("http://localhost/api/admin/returns", {
    method: "PATCH", headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: rejectedRequest.request.id, expectedStatus: "REQUESTED", status: "REJECTED" }),
  }));
  assert.equal(rejected.status, 200);
  assert.equal((await prisma.returnRequest.findUnique({ where: { id: rejectedRequest.request.id } })).status, "REJECTED");

  const receivedOrder = await createOrder(f, { status: "DELIVERED", paymentStatus: "SUCCESS" });
  const receivedItem = await prisma.orderItem.findFirst({ where: { orderId: receivedOrder.id } });
  const receivedRequest = await createCustomerOrderActions(prisma).requestReturn(f.user.id, receivedOrder.id, {
    requestType: "RETURN", reason: "Changed mind", itemIds: [receivedItem.id],
  });
  assert.equal(receivedRequest.status, "created");
  const receivedApproval = await handlers.PATCH(new Request("http://localhost/api/admin/returns", {
    method: "PATCH", headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: receivedRequest.request.id, expectedStatus: "REQUESTED", status: "APPROVED" }),
  }));
  assert.equal(receivedApproval.status, 200);
  const markedReceived = await handlers.PATCH(new Request("http://localhost/api/admin/returns", {
    method: "PATCH", headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: receivedRequest.request.id, expectedStatus: "APPROVED", status: "ITEM_RECEIVED" }),
  }));
  assert.equal(markedReceived.status, 200);
  assert.equal((await prisma.returnRequest.findUnique({ where: { id: receivedRequest.request.id } })).status, "ITEM_RECEIVED");
});

test("customer order history exposes return status only for the authenticated customer's orders", async () => {
  const owner = await fixture({ customer: true });
  const other = await fixture({ customer: true });
  const ownerOrder = await createOrder(owner, { status: "DELIVERED", paymentStatus: "SUCCESS" });
  const otherOrder = await createOrder(other, { status: "DELIVERED", paymentStatus: "SUCCESS" });
  const ownerItem = await prisma.orderItem.findFirst({ where: { orderId: ownerOrder.id } });
  const otherItem = await prisma.orderItem.findFirst({ where: { orderId: otherOrder.id } });
  const ownerRequest = await createCustomerOrderActions(prisma).requestReturn(owner.user.id, ownerOrder.id, {
    requestType: "RETURN", reason: "Owner request", itemIds: [ownerItem.id],
  });
  const otherRequest = await createCustomerOrderActions(prisma).requestReturn(other.user.id, otherOrder.id, {
    requestType: "RETURN", reason: "Other request", itemIds: [otherItem.id],
  });
  assert.equal(ownerRequest.status, "created");
  assert.equal(otherRequest.status, "created");

  const ownerHistory = await loadCustomerOrderHistory(prisma, owner.user.id);
  const otherHistory = await loadCustomerOrderHistory(prisma, other.user.id);
  assert.equal(ownerHistory.status, "loaded");
  assert.equal(otherHistory.status, "loaded");
  assert.deepEqual(ownerHistory.orders.map((order) => order.id), [ownerOrder.id]);
  assert.deepEqual(ownerHistory.orders.flatMap((order) => order.returnRequests.map((request) => request.id)), [ownerRequest.request.id]);
  assert.deepEqual(otherHistory.orders.map((order) => order.id), [otherOrder.id]);
  assert.deepEqual(otherHistory.orders.flatMap((order) => order.returnRequests.map((request) => request.id)), [otherRequest.request.id]);
});
