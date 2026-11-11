import { NextResponse } from "next/server";
import { getCustomerUser } from "@/lib/account-auth";
import prisma from "@/lib/prisma";
import { createOrderReorderService } from "@/lib/order-reorder";

const service = createOrderReorderService(prisma);

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to reorder these items." }, { status: 401 });
  try {
    const result = await service.reorder(user.id, id);
    if (result.status === "not-found") return NextResponse.json({ message: "Order not found." }, { status: 404 });
    if (result.status !== "processed") return NextResponse.json({ message: "Please sign in to reorder these items." }, { status: 401 });
    return NextResponse.json({ message: "Your cart was checked against current products and availability.", lines: result.lines });
  } catch {
    return NextResponse.json({ message: "We could not rebuild your cart. Please try again." }, { status: 503 });
  }
}
