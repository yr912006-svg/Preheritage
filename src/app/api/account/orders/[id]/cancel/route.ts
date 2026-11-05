import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { createCustomerOrderActions } from "@/lib/customer-order-actions";
import { sendCommittedOrderNotification } from "@/lib/order-notifications";

const actions = createCustomerOrderActions(prisma);

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getCustomerUser();
  try {
    const result = await actions.cancelOrder(user?.id, id);
    if (result.status === "cancelled") {
      try { await sendCommittedOrderNotification(prisma, { id, status: "CANCELLED" }, "CANCELLED"); } catch { /* Cancellation is committed independently of email. */ }
      return NextResponse.json({ success: true, message: "Your order was cancelled." });
    }
    if (result.status === "unauthorized") return NextResponse.json({ message: "Please sign in to manage your orders." }, { status: 401 });
    if (result.status === "not-found") return NextResponse.json({ message: "Order not found." }, { status: 404 });
    if (result.status === "conflict") return NextResponse.json({ message: "The order changed while we processed your request. Refresh to see its current status." }, { status: 409 });
    return NextResponse.json({ message: "This order can no longer be cancelled online. Paid or dispatched orders require customer support." }, { status: 409 });
  } catch {
    return NextResponse.json({ message: "We could not cancel this order. Refresh and try again." }, { status: 503 });
  }
}
