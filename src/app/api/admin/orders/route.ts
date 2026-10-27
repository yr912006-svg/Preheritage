import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "@/lib/account-auth";

export async function GET() {
  try {
    const access = await requireAdminUser();
    if (!access.admin) return NextResponse.json({ message: access.status === 401 ? "Authentication required." : "Administrator access required." }, { status: access.status });
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true, user: { select: { name: true, email: true, phone: true } }, payment: { select: { status: true } } } });
    return NextResponse.json({ orders: orders.map((order) => {
      const address = order.shippingAddressSnapshot as Record<string, string> | null;
      return {
        id: order.id, orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || "Guest",
        email: order.guestEmail || order.user?.email || "", phone: order.guestPhone || order.user?.phone || "",
        city: address?.city || "", state: address?.state || "",
        date: order.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" }),
        amount: order.totalAmount, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
        status: order.status, courier: order.courierPartner || undefined, trackingId: order.trackingId || undefined,
        trackingUrl: order.trackingUrl || undefined, items: order.items.map((item) => `${item.title} × ${item.quantity}`),
      };
    }) });
  } catch (error) {
    console.error("Admin order lookup failed:", error);
    return NextResponse.json({ message: "Could not load orders." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireAdminUser();
    if (!access.admin) return NextResponse.json({ message: access.status === 401 ? "Authentication required." : "Administrator access required." }, { status: access.status });
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";
    const status = typeof body?.status === "string" ? body.status : "";
    const courierPartner = typeof body?.courierPartner === "string" ? body.courierPartner.trim().slice(0, 120) : "";
    const trackingId = typeof body?.trackingId === "string" ? body.trackingId.trim().slice(0, 160) : "";
    const allowedStatuses = Object.values(OrderStatus) as string[];
    if (!orderId || !allowedStatuses.includes(status)) return NextResponse.json({ message: "Choose a valid order status." }, { status: 400 });
    const current = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, status: true } });
    if (!current) return NextResponse.json({ message: "Order not found." }, { status: 404 });
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { id: orderId }, data: {
        status: status as OrderStatus,
        ...(courierPartner ? { courierPartner } : {}), ...(trackingId ? { trackingId } : {}),
        ...(status === "SHIPPED" && !current.status.includes("SHIPPED") ? { shippedAt: new Date() } : {}),
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      } });
      await tx.orderTimeline.create({ data: { orderId, status: status as OrderStatus, title: `Order ${status.toLowerCase().replaceAll("_", " ")}`, description: "Order status updated by PREHERITAGE." } });
      return updated;
    });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Admin order update failed:", error);
    return NextResponse.json({ message: "Could not update this order." }, { status: 503 });
  }
}
