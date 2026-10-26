import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, deliveryMethod, giftWrap } = body ?? {};
    if (!Array.isArray(items) || items.length < 1 || items.length > 50 || items.some((i: any) => !i?.productId || !Number.isInteger(Number(i.quantity)) || Number(i.quantity) < 1 || Number(i.quantity) > 20))
      return NextResponse.json({ success: false, message: "Invalid cart items." }, { status: 400 });
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET ||
        process.env.RAZORPAY_KEY_ID === "rzp_test_placeholder" ||
        process.env.RAZORPAY_KEY_SECRET === "rzp_test_placeholder_secret") {
      return NextResponse.json({ success: false, message: "Payment gateway is not configured. Please contact the store." }, { status: 503 });
    }

    const ids = Array.from(new Set(items.map((i: any) => String(i.productId))));
    const products = await prisma.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" } });
    if (products.length !== ids.length) return NextResponse.json({ success: false, message: "A cart item is no longer available." }, { status: 409 });
    let subtotal = 0;
    for (const item of items) {
      const product = products.find((p) => p.id === String(item.productId));
      if (!product) return NextResponse.json({ success: false, message: "A cart item is no longer available." }, { status: 409 });
      const quantity = Number(item.quantity);
      if (item.variantId) {
        const variant = await prisma.productVariant.findFirst({ where: { id: String(item.variantId), productId: product.id } });
        if (!variant || variant.stock < quantity) return NextResponse.json({ success: false, message: `Insufficient stock for ${product.title}.` }, { status: 409 });
        subtotal += (product.price + variant.additionalPrice) * quantity;
      } else {
        if (product.stock < quantity) return NextResponse.json({ success: false, message: `Insufficient stock for ${product.title}.` }, { status: 409 });
        subtotal += product.price * quantity;
      }
    }
    const total = subtotal + (deliveryMethod === "express" ? 499 : subtotal >= 4999 ? 0 : 250) + (giftWrap === true ? 199 : 0);
    const result = await createRazorpayOrder({ amount: total, receipt: `pre_${Date.now()}` });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Unable to create payment order" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Razorpay order API error:", error);
    return NextResponse.json({ message: error.message || "Failed to create payment" }, { status: 500 });
  }
}
