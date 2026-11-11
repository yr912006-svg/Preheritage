import { NextResponse } from "next/server";

export function createAdminPaymentReconciliationRoutes(deps: {
  prisma: any;
  authorize: (capability: "orders.read" | "orders.manage") => Promise<{ status: number }>;
  provider: { orders: { fetch(id: string): Promise<any> }; payments: { fetch(id: string): Promise<any> } };
  finalizeCapturedCheckout: (intentId: string, order: any, payment: any) => Promise<any>;
}) {
  const GET = async () => {
    const access = await deps.authorize("orders.read");
    if (access.status !== 200) return NextResponse.json({ success: false }, { status: access.status });
    const [checkouts, events] = await Promise.all([
      deps.prisma.razorpayCheckout.findMany({ where: { OR: [{ status: "RECOVERY_REQUIRED" }, { status: "FINALIZED", orderId: null, recoveryReason: { not: null } }] }, orderBy: { updatedAt: "desc" }, take: 100,
        select: { id: true, customerEmail: true, amount: true, currency: true, razorpayOrderId: true, razorpayPaymentId: true, status: true, recoveryReason: true, recoveryAttempts: true, createdAt: true, updatedAt: true } }),
      deps.prisma.razorpayWebhookEvent.findMany({ where: { status: { in: ["RECOVERY_REQUIRED", "RETRY", "PROCESSING"] } }, orderBy: { receivedAt: "desc" }, take: 100,
        select: { eventId: true, eventType: true, orderId: true, paymentId: true, status: true, lastError: true, attempts: true, lockUntil: true, receivedAt: true } }),
    ]);
    const orderIds = Array.from(new Set(events.map((event: any) => event.orderId).filter((id: unknown): id is string => typeof id === "string" && Boolean(id))));
    const linked = orderIds.length ? await deps.prisma.razorpayCheckout.findMany({ where: { razorpayOrderId: { in: orderIds } }, select: { id: true, razorpayOrderId: true } }) : [];
    const checkoutByOrder = new Map(linked.map((checkout: any) => [checkout.razorpayOrderId, checkout.id]));
    return NextResponse.json({ success: true, checkouts, events: events.map((event: any) => ({ ...event, checkoutId: event.orderId ? checkoutByOrder.get(event.orderId) ?? null : null })) });
  };

  const POST = async (req: Request) => {
    const access = await deps.authorize("orders.manage");
    if (access.status !== 200) return NextResponse.json({ success: false }, { status: access.status });
    try {
      const { checkoutId } = await req.json();
      if (typeof checkoutId !== "string" || !checkoutId) return NextResponse.json({ success: false, message: "A checkout ID is required." }, { status: 400 });
      const intent = await deps.prisma.razorpayCheckout.findUnique({ where: { id: checkoutId } });
      if (!intent?.razorpayOrderId || !intent.razorpayPaymentId) return NextResponse.json({ success: false, message: "This record does not have a captured payment to reconcile." }, { status: 409 });
      const [order, payment] = await Promise.all([
        deps.provider.orders.fetch(intent.razorpayOrderId),
        deps.provider.payments.fetch(intent.razorpayPaymentId),
      ]);
      const result = await deps.finalizeCapturedCheckout(intent.id, order, payment);
      return NextResponse.json({ success: true, orderId: result.id, orderNumber: result.orderNumber });
    } catch (error) {
      console.error("Razorpay manual reconciliation failed:", error);
      return NextResponse.json({ success: false, message: "Reconciliation could not safely finalize this checkout. Keep it under manual review." }, { status: 409 });
    }
  };
  return { GET, POST };
}
