import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createRazorpayOrderService, isRazorpayServerConfigured } from "./razorpay.ts";
import { createRazorpayBrowserCallback } from "./razorpay-browser-callback.ts";
import { createCheckoutRecoveryService } from "./razorpay-checkout-recovery.ts";
import { createRazorpayWebhookHandler } from "./razorpay-webhook-handler.ts";

const paymentSecret = "unit-payment-secret";
const webhookSecret = "unit-webhook-secret";

function paymentSignature(orderId, paymentId, secret = paymentSecret) {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

function gatewayFixture() {
  const order = { id: "order_unit_1", amount: 35000, currency: "INR" };
  const payment = { id: "pay_unit_1", order_id: order.id, amount: order.amount, currency: "INR", status: "captured" };
  return { order, payment, provider: {
    orders: { fetch: async (id) => ({ ...order, id }) },
    payments: { fetch: async (id) => ({ ...payment, id }) },
  } };
}

test("Razorpay order service sends paise and PREHERITAGE receipt notes through the injected provider", async () => {
  let options;
  const createOrder = createRazorpayOrderService({ orders: { create: async (value) => { options = value; return { id: "order_mock_unit" }; } } });
  const result = await createOrder({ amount: 350.25, receipt: "checkout-unit", notes: { checkout_id: "checkout-unit" } });
  assert.deepEqual(result, { success: true, order: { id: "order_mock_unit" } });
  assert.deepEqual(options, { amount: 35025, currency: "INR", receipt: "checkout-unit", notes: { brand: "PREHERITAGE", checkout_id: "checkout-unit" } });
});

test("Razorpay order service reports provider failure without requiring credentials", async (t) => {
  t.mock.method(console, "error", () => {});
  const createOrder = createRazorpayOrderService({ orders: { create: async () => { throw new Error("mock provider unavailable"); } } });
  const result = await createOrder({ amount: 350, receipt: "checkout-unit" });
  assert.deepEqual(result, { success: false, error: "mock provider unavailable" });
});

test("Razorpay checkout configuration fails closed when either server credential is missing or placeholder", () => {
  assert.equal(isRazorpayServerConfigured(undefined, undefined), false);
  assert.equal(isRazorpayServerConfigured("key", undefined), false);
  assert.equal(isRazorpayServerConfigured(undefined, "secret"), false);
  assert.equal(isRazorpayServerConfigured("rzp_test_placeholder", "secret"), false);
  assert.equal(isRazorpayServerConfigured("key", "rzp_test_placeholder_secret"), false);
  assert.equal(isRazorpayServerConfigured("rzp_test_x", "test-secret"), true);
});

test("browser callback rejects missing credentials before contacting the provider", async () => {
  let calls = 0;
  const finalize = createRazorpayBrowserCallback({
    prisma: {}, provider: { orders: { fetch: async () => { calls += 1; } }, payments: { fetch: async () => { calls += 1; } } },
    paymentSecret: () => undefined, markCapturedCheckout: async () => assert.fail("must not finalize"),
  });
  const response = await finalize({ accountUser: null, customer: { email: "guest@example.test" }, orderId: "order_unit_1", paymentId: "pay_unit_1", signature: "" });
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("browser callback verifies provider state and customer ownership before finalization", async () => {
  const gateway = gatewayFixture();
  let finalized = 0;
  const prisma = {
    payment: { findFirst: async () => null },
    razorpayCheckout: { findUnique: async () => ({ id: "checkout-unit", userId: null, customerEmail: "guest@example.test" }) },
  };
  const finalize = createRazorpayBrowserCallback({
    prisma, provider: gateway.provider, paymentSecret: () => paymentSecret,
    markCapturedCheckout: async ({ intentId, order, payment }) => { finalized += 1; assert.equal(intentId, "checkout-unit"); return { id: "order-db-unit", orderNumber: "PRE-UNIT" }; },
  });
  const invalidOwner = await finalize({ accountUser: null, customer: { email: "other@example.test" }, orderId: gateway.order.id, paymentId: gateway.payment.id, signature: paymentSignature(gateway.order.id, gateway.payment.id) });
  assert.equal(invalidOwner.status, 403);
  assert.equal(finalized, 0);
  const accepted = await finalize({ accountUser: null, customer: { email: " Guest@Example.Test " }, orderId: gateway.order.id, paymentId: gateway.payment.id, signature: paymentSignature(gateway.order.id, gateway.payment.id) });
  assert.equal(accepted.response.status, 200);
  assert.equal(finalized, 1);
});

test("captured Razorpay payment without a checkout intent is retained for manual review, not finalized", async () => {
  const gateway = gatewayFixture();
  const events = [];
  const finalize = createRazorpayBrowserCallback({
    prisma: {
      payment: { findFirst: async () => null },
      razorpayCheckout: { findUnique: async () => null },
      razorpayWebhookEvent: { create: async ({ data }) => { events.push(data); return data; } },
    },
    provider: gateway.provider, paymentSecret: () => paymentSecret,
    markCapturedCheckout: async () => assert.fail("unmatched payment must not create an order"),
  });
  const response = await finalize({ accountUser: null, customer: { email: "guest@example.test" }, orderId: gateway.order.id, paymentId: gateway.payment.id, signature: paymentSignature(gateway.order.id, gateway.payment.id) });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).recoveryRequired, true);
  assert.equal(events.length, 1);
  assert.equal(events[0].status, "RECOVERY_REQUIRED");
  assert.equal(events[0].orderId, gateway.order.id);
  assert.equal(events[0].paymentId, gateway.payment.id);
});

test("checkout recovery rejects amount mismatch without inventory or order writes", async () => {
  const gateway = gatewayFixture();
  const intent = { id: "checkout-unit", status: "PENDING", orderId: null, razorpayOrderId: gateway.order.id, razorpayPaymentId: null,
    userId: null, customerEmail: "guest@example.test", currency: "INR", amount: 350,
    snapshot: { customer: { email: "guest@example.test" }, items: [{ productId: "product-unit", quantity: 1 }], userId: null, couponCode: null,
      deliveryMethod: "standard", giftWrap: false, giftMessage: null, orderNotes: null,
      pricing: { subtotal: 100, discountAmount: 0, shippingCharge: 250, giftWrapCharge: 0, totalAmount: 350 } } };
  let writes = 0;
  const prisma = { razorpayCheckout: {
    findUnique: async () => intent,
    updateMany: async () => { writes += 1; return { count: 1 }; },
  }, $transaction: async () => { writes += 1; } };
  const recovery = createCheckoutRecoveryService({ prisma, validateCouponForOrder: async () => ({ valid: true, coupon: null, discountAmount: 0, freeShipping: false }) });
  await assert.rejects(recovery.markCapturedCheckout({ intentId: intent.id, order: gateway.order, payment: { ...gateway.payment, amount: 1 } }), { code: "PAYMENT_MISMATCH" });
  assert.equal(writes, 0);
});

test("checkout recovery finalizes a valid captured payment through injected transaction delegates", async () => {
  const gateway = gatewayFixture();
  const intent = { id: "checkout-unit", status: "PENDING", orderId: null, razorpayOrderId: gateway.order.id, razorpayPaymentId: null,
    userId: null, customerEmail: "guest@example.test", currency: "INR", amount: 350,
    snapshot: { customer: { email: "guest@example.test", fullName: "Test Guest", phone: "0000000000" }, items: [{ productId: "product-unit", quantity: 1 }], userId: null, couponCode: null,
      deliveryMethod: "standard", giftWrap: false, giftMessage: null, orderNotes: null,
      pricing: { subtotal: 100, discountAmount: 0, shippingCharge: 250, giftWrapCharge: 0, totalAmount: 350 } } };
  const product = { id: "product-unit", title: "Test Saree", sku: "SKU-UNIT", price: 100, stock: 4, variants: [], images: [{ url: "https://example.test/image.jpg" }] };
  let orderData;
  const tx = {
    $queryRaw: async () => [{ status: intent.status, orderId: intent.orderId }],
    product: { updateMany: async ({ where, data }) => {
      if (where.id !== product.id || product.stock < where.stock.gte) return { count: 0 };
      product.stock -= data.stock.decrement; return { count: 1 };
    } },
    order: { create: async ({ data }) => { orderData = data; return { id: "order-db-unit", orderNumber: data.orderNumber }; } },
    razorpayCheckout: { update: async ({ data }) => { Object.assign(intent, data); return intent; } },
  };
  const prisma = {
    razorpayCheckout: {
      findUnique: async () => intent,
      updateMany: async ({ data }) => { Object.assign(intent, data); return { count: 1 }; },
    },
    product: { findMany: async () => [product] },
    $transaction: async (work) => work(tx),
  };
  const recovery = createCheckoutRecoveryService({
    prisma, validateCouponForOrder: async () => ({ valid: true, coupon: null, discountAmount: 0, freeShipping: false }),
    now: () => new Date("2026-01-01T00:00:00Z"), newId: () => "unit-order-id",
  });
  const finalized = await recovery.markCapturedCheckout({ intentId: intent.id, order: gateway.order, payment: gateway.payment });
  assert.equal(finalized.id, "order-db-unit");
  assert.equal(intent.status, "FINALIZED");
  assert.equal(intent.orderId, "order-db-unit");
  assert.equal(intent.razorpayPaymentId, gateway.payment.id);
  assert.equal(product.stock, 3);
  assert.equal(orderData.payment.create.razorpayPaymentId, gateway.payment.id);
  assert.equal(orderData.payment.create.razorpayOrderId, gateway.order.id);
});

function fakeWebhookPrisma({ intent }) {
  const events = new Map();
  const prisma = {
    razorpayWebhookEvent: {
      create: async ({ data }) => {
        if (events.has(data.eventId)) { const error = new Error("duplicate"); error.code = "P2002"; throw error; }
        const event = { id: `event-${events.size + 1}`, ...data, status: "RECEIVED", attempts: 0 };
        events.set(data.eventId, event); return event;
      },
      findUnique: async ({ where }) => where.eventId ? events.get(where.eventId) ?? null : [...events.values()].find((item) => item.id === where.id) ?? null,
    },
    razorpayCheckout: { findUnique: async () => intent },
    payment: { findFirst: async () => null },
    $queryRaw: async (strings, ...values) => {
      const query = strings.join(" ");
      if (query.includes('"attempts" = "attempts" + 1')) {
        const [token, , id] = values;
        const event = [...events.values()].find((item) => item.id === id);
        if (!event || !["RECEIVED", "RETRY"].includes(event.status)) return [];
        Object.assign(event, { status: "PROCESSING", attempts: event.attempts + 1, claimToken: token, lockUntil: new Date(Date.now() + 120000) });
        return [{ id }];
      }
      if (query.includes('SET "status" =')) {
        const [status, lastError, processedAt, id, token] = values;
        const event = [...events.values()].find((item) => item.id === id);
        if (!event || event.status !== "PROCESSING" || event.claimToken !== token) return [];
        Object.assign(event, { status, lastError, processedAt, claimToken: null, lockUntil: null });
        return [{ id }];
      }
      if (query.includes('SET "lockUntil"')) {
        const [, id, token] = values;
        const event = [...events.values()].find((item) => item.id === id);
        return event?.status === "PROCESSING" && event.claimToken === token ? [{ id }] : [];
      }
      throw new Error(`Unexpected mocked SQL: ${query}`);
    },
  };
  return { prisma, events };
}

function webhookRequest(eventId, orderId, paymentId, secret = webhookSecret) {
  const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: paymentId, order_id: orderId } } } });
  const signature = createHmac("sha256", secret).update(raw).digest("hex");
  return new Request("http://localhost/api/razorpay/webhook", { method: "POST", headers: { "x-razorpay-event-id": eventId, "x-razorpay-signature": signature }, body: raw });
}

test("webhook rejects a missing secret without creating an event or calling mocked Razorpay", async () => {
  const gateway = gatewayFixture();
  let fetches = 0;
  const { prisma, events } = fakeWebhookPrisma({ intent: {} });
  const handler = createRazorpayWebhookHandler({ prisma, provider: { orders: { fetch: async () => { fetches += 1; } }, payments: { fetch: async () => { fetches += 1; } } }, webhookSecret: () => undefined, markCapturedCheckout: async () => {}, isRecoveryError: () => false });
  const response = await handler(webhookRequest("evt-unit", gateway.order.id, gateway.payment.id));
  assert.equal(response.status, 400);
  assert.equal(events.size, 0);
  assert.equal(fetches, 0);
});

test("webhook verifies mocked provider state and invokes recovery once for a captured event", async () => {
  const gateway = gatewayFixture();
  const intent = { id: "checkout-unit", razorpayOrderId: gateway.order.id };
  const { prisma, events } = fakeWebhookPrisma({ intent });
  let finalized = 0;
  const handler = createRazorpayWebhookHandler({
    prisma, provider: gateway.provider, webhookSecret: () => webhookSecret,
    markCapturedCheckout: async (input) => { finalized += 1; assert.equal(input.intentId, intent.id); },
    isRecoveryError: () => false, newClaimToken: () => "claim-unit",
  });
  const response = await handler(webhookRequest("evt-unit", gateway.order.id, gateway.payment.id));
  assert.equal(response.status, 200);
  assert.equal(finalized, 1);
  assert.equal([...events.values()][0].status, "PROCESSED");
});
