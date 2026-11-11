import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { checkoutFailureDisposition, paymentWebhookAction, verifyRazorpayWebhookSignature, webhookEventDisposition } from "@/lib/payment-integrity";

const leaseSeconds = 120;
type EventResult = Array<{ id: string }>;

export function createRazorpayWebhookHandler(deps: {
  prisma: any;
  provider: { payments: { fetch(id: string): Promise<any> }; orders: { fetch(id: string): Promise<any> } };
  webhookSecret: () => string | undefined;
  verifySignature?: typeof verifyRazorpayWebhookSignature;
  markCapturedCheckout: (input: { intentId: string; order: any; payment: any }) => Promise<any>;
  isRecoveryError: (error: unknown) => error is { code: string };
  now?: () => Date;
  newClaimToken?: () => string;
  hooks?: {
    afterClaim?: (eventId: string, token: string) => Promise<void> | void;
    afterProviderVerification?: (eventId: string, token: string) => Promise<void> | void;
    beforeFinalization?: (eventId: string, token: string) => Promise<void> | void;
  };
}) {
  const { prisma } = deps;
  const now = deps.now ?? (() => new Date());
  const tokenFactory = deps.newClaimToken ?? randomUUID;
  const verifySignature = deps.verifySignature ?? verifyRazorpayWebhookSignature;

  async function claim(eventId: string, token: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<EventResult>`
      UPDATE "razorpay_webhook_events"
      SET "status" = 'PROCESSING', "attempts" = "attempts" + 1,
          "claimToken" = ${token},
          "lockUntil" = (clock_timestamp() AT TIME ZONE 'UTC') + (${leaseSeconds} * INTERVAL '1 second'),
          "lastError" = NULL, "updatedAt" = clock_timestamp() AT TIME ZONE 'UTC'
      WHERE "id" = ${eventId}
        AND ("status" IN ('RECEIVED', 'RETRY') OR
             ("status" = 'PROCESSING' AND ("lockUntil" IS NULL OR "lockUntil" <= (clock_timestamp() AT TIME ZONE 'UTC'))))
      RETURNING "id"
    `;
    return rows.length === 1;
  }

  async function renew(eventId: string, token: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<EventResult>`
      UPDATE "razorpay_webhook_events"
      SET "lockUntil" = (clock_timestamp() AT TIME ZONE 'UTC') + (${leaseSeconds} * INTERVAL '1 second'),
          "updatedAt" = clock_timestamp() AT TIME ZONE 'UTC'
      WHERE "id" = ${eventId} AND "status" = 'PROCESSING' AND "claimToken" = ${token}
        AND "lockUntil" > (clock_timestamp() AT TIME ZONE 'UTC')
      RETURNING "id"
    `;
    return rows.length === 1;
  }

  async function complete(eventId: string, token: string, data: Record<string, unknown>): Promise<boolean> {
    const rows = await prisma.$queryRaw<EventResult>`
      UPDATE "razorpay_webhook_events"
      SET "status" = ${data.status as string}, "lastError" = ${data.lastError ?? null},
          "processedAt" = ${data.processedAt ?? null}, "claimToken" = NULL,
          "lockUntil" = NULL, "updatedAt" = clock_timestamp() AT TIME ZONE 'UTC'
      WHERE "id" = ${eventId} AND "status" = 'PROCESSING' AND "claimToken" = ${token}
        AND "lockUntil" > (clock_timestamp() AT TIME ZONE 'UTC')
      RETURNING "id"
    `;
    return rows.length === 1;
  }

  return async function handle(req: Request) {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const eventId = req.headers.get("x-razorpay-event-id") ?? "";
    const secret = deps.webhookSecret();
    if (!secret || !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ success: false, message: "Invalid webhook signature." }, { status: 400 });
    }
    if (!eventId || eventId.length > 255) return NextResponse.json({ success: false, message: "Missing webhook event identity." }, { status: 400 });

    let body: any;
    try { body = JSON.parse(rawBody); }
    catch { return NextResponse.json({ success: false, message: "Invalid webhook body." }, { status: 400 }); }
    const eventType = typeof body?.event === "string" ? body.event : "unknown";
    const payloadHash = createHash("sha256").update(rawBody, "utf8").digest("hex");
    const entity = body?.payload?.payment?.entity ?? body?.payload?.order?.entity ?? null;
    const orderId = typeof entity?.order_id === "string" ? entity.order_id : (typeof entity?.id === "string" && entity.id.startsWith("order_") ? entity.id : null);
    const paymentId = typeof entity?.id === "string" && entity.id.startsWith("pay_") ? entity.id : null;

    let event: any;
    try {
      event = await prisma.razorpayWebhookEvent.create({ data: { eventId, eventType, orderId, paymentId, payloadHash } });
    } catch (error: any) {
      if (error?.code !== "P2002") return NextResponse.json({ success: false }, { status: 500 });
      event = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId } });
      const disposition = webhookEventDisposition(event, payloadHash);
      if (disposition === "identity-conflict") return NextResponse.json({ success: false, message: "Webhook event identity was reused with different content." }, { status: 409 });
      if (disposition === "duplicate") return NextResponse.json({ success: true, duplicate: true });
    }

    const token = tokenFactory();
    if (!await claim(event.id, token)) {
      const current = await prisma.razorpayWebhookEvent.findUnique({ where: { id: event.id } });
      if (current && ["PROCESSED", "IGNORED", "RECOVERY_REQUIRED"].includes(current.status)) return NextResponse.json({ success: true, duplicate: true });
      return NextResponse.json({ success: false, message: "Webhook event is already being processed." }, { status: 503 });
    }
    await deps.hooks?.afterClaim?.(eventId, token);
    const leaseLost = () => NextResponse.json({ success: false, message: "Webhook processing lease was lost; retry delivery." }, { status: 503 });
    const completeClaim = (data: Record<string, unknown>) => complete(event.id, token, data);

    try {
      if (eventType !== "payment.captured" && eventType !== "payment.failed") {
        if (!await completeClaim({ status: "IGNORED", processedAt: now(), lastError: null })) return leaseLost();
        return NextResponse.json({ success: true, ignored: true });
      }
      if (!paymentId || !orderId) {
        if (!await completeClaim({ status: "RECOVERY_REQUIRED", lastError: "Payment event did not include both payment and order identifiers.", processedAt: null })) return leaseLost();
        return NextResponse.json({ success: true, recoveryRequired: true });
      }

      const [payment, order] = await Promise.all([deps.provider.payments.fetch(paymentId), deps.provider.orders.fetch(orderId)]);
      if (payment.id !== paymentId || order.id !== orderId || payment.order_id !== orderId) {
        if (!await completeClaim({ status: "RECOVERY_REQUIRED", lastError: "Provider payment/order relationship did not match the event.", processedAt: null })) return leaseLost();
        return NextResponse.json({ success: true, recoveryRequired: true });
      }
      await deps.hooks?.afterProviderVerification?.(eventId, token);
      if (!await renew(event.id, token)) return leaseLost();

      const intent = await prisma.razorpayCheckout.findUnique({ where: { razorpayOrderId: orderId } });
      if (!intent) {
        const existing = await prisma.payment.findFirst({ where: { razorpayOrderId: orderId, razorpayPaymentId: paymentId }, select: { id: true } });
        if (!await completeClaim({ status: existing ? "PROCESSED" : "RECOVERY_REQUIRED", lastError: existing ? null : "Captured payment has no matching PREHERITAGE checkout snapshot.", processedAt: existing ? now() : null })) return leaseLost();
        return NextResponse.json({ success: true, recoveryRequired: !existing });
      }

      const action = paymentWebhookAction(eventType, payment.status);
      if (action === "finalize") {
        if (!await renew(event.id, token)) return leaseLost();
        await deps.hooks?.beforeFinalization?.(eventId, token);
        await deps.markCapturedCheckout({ intentId: intent.id, order, payment });
        if (!await completeClaim({ status: "PROCESSED", processedAt: now(), lastError: null })) return leaseLost();
        return NextResponse.json({ success: true });
      }
      if (action === "record-failure") {
        await prisma.razorpayCheckout.updateMany({
          where: { id: intent.id, status: { notIn: ["CAPTURED", "FINALIZED", "RECOVERY_REQUIRED"] } },
          data: { status: "PAYMENT_FAILED", recoveryReason: "Razorpay reports the current payment attempt failed." },
        });
      }
      if (!await completeClaim({ status: "PROCESSED", processedAt: now(), lastError: null })) return leaseLost();
      return NextResponse.json({ success: true });
    } catch (error: any) {
      const recoverable = deps.isRecoveryError(error) && checkoutFailureDisposition(error.code) === "recovery-required";
      const completed = await completeClaim({ status: recoverable ? "RECOVERY_REQUIRED" : "RETRY", lastError: error instanceof Error ? error.message.slice(0, 500) : "Webhook processing failed.", processedAt: null }).catch(() => false);
      if (!completed) return leaseLost();
      return NextResponse.json({ success: false, recoveryRequired: recoverable }, { status: recoverable ? 200 : 500 });
    }
  };
}
