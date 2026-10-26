import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^PRE-[A-Z0-9-]{8,50}$/i.test(orderNumber)) return NextResponse.json({ message: "Enter a valid order reference." }, { status: 400 });
    const user = await getCustomerUser();
    const order = await prisma.order.findFirst({
      where: user ? { orderNumber, userId: user.id } : { orderNumber, guestEmail: email },
      select: {
        id: true, orderNumber: true, status: true, totalAmount: true, paymentMethod: true, paymentStatus: true,
        courierPartner: true, trackingId: true, trackingUrl: true, createdAt: true,
        items: { select: { title: true, size: true, color: true, quantity: true } },
        timeline: { orderBy: { createdAt: "asc" }, select: { status: true, title: true, description: true, createdAt: true } },
      },
    });
    if (!order) return NextResponse.json({ message: "We could not find an order matching those details." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order lookup failed:", error);
    return NextResponse.json({ message: "Order details are temporarily unavailable." }, { status: 503 });
  }
}
