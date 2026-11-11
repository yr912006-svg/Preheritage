import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { adminAuditStore } from "@/lib/admin-audit";
import { canAdminCancelOrder, canAdminTransitionOrderStatus } from "@/lib/order-status";
import { persistOrderStatusTransition } from "@/lib/admin-order-transition";
import { sendCommittedOrderNotification } from "@/lib/order-notifications";

async function getOrders(_request: Request) {
  try {
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

async function updateOrder(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";
    const status = typeof body?.status === "string" ? body.status : "";
    const courierPartner = typeof body?.courierPartner === "string" ? body.courierPartner.trim().slice(0, 120) : "";
    const trackingId = typeof body?.trackingId === "string" ? body.trackingId.trim().slice(0, 160) : "";
    const allowedStatuses = Object.values(OrderStatus) as string[];
    if (!orderId || !allowedStatuses.includes(status)) return NextResponse.json({ message: "Choose a valid order status." }, { status: 400 });
    if (status === "REFUNDED") return NextResponse.json({ message: "Refunds must be processed and verified through the payment refund workflow." }, { status: 409 });
    const current = await prisma.order.findUnique({ where: { id: orderId }, select: {
      id: true, status: true, paymentStatus: true,
      items: { select: { productId: true, variantId: true, quantity: true } },
    } });
    if (!current) return NextResponse.json({ message: "Order not found." }, { status: 404 });
    if (status === "CANCELLED" && !canAdminCancelOrder(current.status, current.paymentStatus)) {
      const message = current.paymentStatus === "SUCCESS"
        ? "Paid orders cannot be cancelled here because a verified refund workflow is not available."
        : `Order cannot move from ${current.status} to ${status} or its payment state is not eligible.`;
      return NextResponse.json({ message }, { status: 409 });
    }
    if (!canAdminTransitionOrderStatus(current.status, status)) {
      return NextResponse.json({ message: `Order cannot move from ${current.status} to ${status}.` }, { status: 409 });
    }
    const order = await prisma.$transaction(async (tx) => {
      return persistOrderStatusTransition(tx, { orderId, expectedStatus: current.status,
        ...(status === "CANCELLED" ? { expectedPaymentStatus: current.paymentStatus, cancellationItems: current.items } : {}),
        nextStatus: status, updateData: {
        status: status as OrderStatus,
        ...(courierPartner ? { courierPartner } : {}), ...(trackingId ? { trackingId } : {}),
        ...(status === "SHIPPED" && !current.status.includes("SHIPPED") ? { shippedAt: new Date() } : {}),
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      } });
    });
    if (!order) return NextResponse.json({ message: "Order status changed during this update. Refresh and try again." }, { status: 409 });
    try { await sendCommittedOrderNotification(prisma, order, status); } catch { /* Keep the committed status transition successful. */ }
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Admin order update failed:", error);
    return NextResponse.json({ message: "Could not update this order." }, { status: 503 });
  }
}

function createAdminOrderHandlers(authorize = requireAdminCapability) {
  return {
    GET: withAdminCapability(ADMIN_API_CAPABILITIES.orders.methods.GET, getOrders, authorize),
    PATCH: withAdminCapability(ADMIN_API_CAPABILITIES.orders.methods.PATCH, updateOrder, authorize, adminAuditStore),
  };
}

const handlers = createAdminOrderHandlers();
export const { GET, PATCH } = handlers;
