import { NextResponse } from "next/server";
import { getCustomerUser } from "@/lib/account-auth";
import prisma from "@/lib/prisma";
import { buildInvoiceHtml, loadOwnedInvoiceOrder } from "@/lib/order-invoice";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to view this invoice." }, { status: 401 });
  try {
    const result = await loadOwnedInvoiceOrder(prisma, user.id, id);
    if (result.status === "not-found") return NextResponse.json({ message: "Order not found." }, { status: 404 });
    if (result.status !== "found") return NextResponse.json({ message: "Please sign in to view this invoice." }, { status: 401 });
    const filename = result.order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
    return new Response(buildInvoiceHtml(result.order), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="invoice-${filename}.html"`,
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "We could not load this invoice." }, { status: 503 });
  }
}
