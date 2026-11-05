import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { createCustomerOrderActions, decodeCustomerReturnRequest } from "@/lib/customer-order-actions";

const actions = createCustomerOrderActions(prisma);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getCustomerUser();
  try {
    const body = await request.json();
    const result = await actions.requestReturn(user?.id, id, body);
    if (result.status === "created") {
      const details = decodeCustomerReturnRequest(result.request.explanation);
      return NextResponse.json({ success: true, message: "Your request was submitted for review. This does not mean it has been approved.", request: { id: result.request.id, status: result.request.status, requestType: details?.requestType ?? null } }, { status: 201 });
    }
    if (result.status === "unauthorized") return NextResponse.json({ message: "Please sign in to request a return or exchange." }, { status: 401 });
    if (result.status === "not-found") return NextResponse.json({ message: "Order not found." }, { status: 404 });
    if (result.status === "invalid-items") return NextResponse.json({ message: "Select items from this order only." }, { status: 400 });
    if (result.status === "duplicate") return NextResponse.json({ message: "There is already an active request for this order." }, { status: 409 });
    if (result.status === "invalid") return NextResponse.json({ message: "Choose a request type, reason, and at least one order item." }, { status: 400 });
    return NextResponse.json({ message: "Return and exchange requests are available after delivery." }, { status: 409 });
  } catch {
    return NextResponse.json({ message: "We could not submit your request. Please try again." }, { status: 503 });
  }
}
