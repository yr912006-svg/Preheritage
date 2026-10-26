import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";

export async function GET() {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to view your orders." }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true, timeline: { orderBy: { createdAt: "asc" } }, payment: { select: { status: true, method: true } } },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Customer order lookup failed:", error);
    return NextResponse.json({ message: "We could not load your orders." }, { status: 503 });
  }
}
