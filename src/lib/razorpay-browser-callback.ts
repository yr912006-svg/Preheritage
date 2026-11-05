import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isCapturedPaymentForOrder, paymentReplayMatches, verifyRazorpayHmac } from "@/lib/payment-integrity";

export function createRazorpayBrowserCallback(deps: {
  prisma: any;
  provider: { orders: { fetch(id: string): Promise<any> }; payments: { fetch(id: string): Promise<any> } };
  paymentSecret: () => string | undefined;
  verifySignature?: typeof verifyRazorpayHmac;
  markCapturedCheckout: (input: { intentId: string; order: any; payment: any }) => Promise<any>;
}) {
  const verify = deps.verifySignature ?? verifyRazorpayHmac;
  return async function finalize(input: {
    accountUser: { id: string } | null;
    customer: { email: string };
    orderId: string;
    paymentId: string;
    signature: string;
  }) {
    const secret = deps.paymentSecret();
    if (!secret || !verify(input.orderId, input.paymentId, input.signature, secret)) {
      return NextResponse.json({ success: false, message: "Invalid payment signature." }, { status: 400 });
    }
    const [order, payment] = await Promise.all([
      deps.provider.orders.fetch(input.orderId),
      deps.provider.payments.fetch(input.paymentId),
    ]);
    if (order.id !== input.orderId || payment.id !== input.paymentId || !isCapturedPaymentForOrder(order, payment)) {
      return NextResponse.json({ success: false, message: "Payment could not be confirmed with Razorpay." }, { status: 400 });
    }
    const prior = await deps.prisma.payment.findFirst({
      where: { OR: [{ razorpayPaymentId: input.paymentId }, { razorpayOrderId: input.orderId }] },
      include: { order: { select: { id: true, orderNumber: true } } },
    });
    if (prior) {
      if (paymentReplayMatches(prior, { orderId: input.orderId, paymentId: input.paymentId }) === "same" && prior.order) {
        return NextResponse.json({ success: true, orderId: prior.order.id, orderNumber: prior.order.orderNumber, replay: true });
      }
      return NextResponse.json({ success: false, message: "This Razorpay order or payment is already linked to another checkout." }, { status: 409 });
    }
    const intent = await deps.prisma.razorpayCheckout.findUnique({ where: { razorpayOrderId: input.orderId } });
    if (!intent) {
      const recoveryReference = JSON.stringify({ orderId: order.id, paymentId: payment.id, amount: payment.amount, currency: payment.currency, status: payment.status });
      const eventId = `browser-callback-${createHash("sha256").update(payment.id, "utf8").digest("hex")}`;
      const payloadHash = createHash("sha256").update(recoveryReference, "utf8").digest("hex");
      try {
        await deps.prisma.razorpayWebhookEvent.create({ data: {
          eventId, eventType: "browser.payment.unmatched", orderId: order.id, paymentId: payment.id,
          payloadHash, status: "RECOVERY_REQUIRED",
          lastError: "Captured payment has no matching PREHERITAGE checkout intent; manual review required.",
        } });
      } catch (error: any) {
        if (error?.code !== "P2002") throw error;
        const existing = await deps.prisma.razorpayWebhookEvent.findUnique({ where: { eventId } });
        if (!existing || existing.orderId !== order.id || existing.paymentId !== payment.id || existing.payloadHash !== payloadHash) throw error;
      }
      return NextResponse.json({ success: false, recoveryRequired: true, message: "Payment was captured but could not be matched to a saved checkout. It has been retained for manual review." }, { status: 409 });
    }
    const email = String(input.customer.email).trim().toLowerCase();
    if ((intent.userId && intent.userId !== input.accountUser?.id) || (!intent.userId && intent.customerEmail !== email)) {
      return NextResponse.json({ success: false, message: "This payment does not belong to this checkout." }, { status: 403 });
    }
    const savedOrder = await deps.markCapturedCheckout({ intentId: intent.id, order, payment });
    return { response: NextResponse.json({ success: true, orderId: savedOrder.id, orderNumber: savedOrder.orderNumber, replay: Boolean(savedOrder.replay) }) };
  };
}
