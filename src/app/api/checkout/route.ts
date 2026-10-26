import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyRazorpaySignature, razorpayInstance } from "@/lib/razorpay";
import { randomUUID } from "crypto";
import { getCustomerUser } from "@/lib/account-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accountUser = await getCustomerUser();
    const { customer, items, paymentMethod, deliveryMethod, giftMessage, orderNotes,
      razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};

    if (!customer?.fullName || !customer?.email || !customer?.phone || !customer?.houseFlat ||
        !customer?.area || !customer?.city || !customer?.state || !/^\d{6}$/.test(String(customer?.pincode ?? ""))) {
      return NextResponse.json({ success: false, message: "Please provide complete and valid delivery details." }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json({ success: false, message: "Your bag is empty or contains an invalid number of items." }, { status: 400 });
    }
    if (paymentMethod !== "COD" && paymentMethod !== "RAZORPAY") {
      return NextResponse.json({ success: false, message: "This payment method is not currently supported." }, { status: 400 });
    }
    if (paymentMethod === "RAZORPAY") {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature ||
          !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === "rzp_test_placeholder_secret" ||
          String(razorpay_order_id).startsWith("order_mock") ||
          !verifyRazorpaySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature })) {
        return NextResponse.json({ success: false, message: "A verified Razorpay payment is required before placing this order." }, { status: 400 });
      }
    }

    const normalizedItems = items.map((item: any) => ({
      productId: String(item?.productId ?? ""),
      variantId: item?.variantId ? String(item.variantId) : null,
      quantity: Number(item?.quantity),
    }));
    if (normalizedItems.some((item: any) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
      return NextResponse.json({ success: false, message: "One or more cart items are invalid." }, { status: 400 });
    }

    const ids = Array.from(new Set(normalizedItems.map((item: any) => item.productId)));
    const products = await prisma.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, include: { images: { orderBy: { orderIndex: "asc" }, take: 1 } } });
    const productMap = new Map(products.map((product: any) => [product.id, product]));
    if (products.length !== ids.length) {
      return NextResponse.json({ success: false, message: "One or more products are no longer available." }, { status: 409 });
    }

    let subtotal = 0;
    const verifiedItems: any[] = [];
    for (const item of normalizedItems) {
      const product: any = productMap.get(item.productId);
      if (!product) throw new Error("Product not found");
      let variant: any = null;
      if (item.variantId) {
        variant = await prisma.productVariant.findFirst({ where: { id: item.variantId, productId: item.productId } });
        if (!variant || variant.stock < item.quantity) {
          return NextResponse.json({ success: false, message: `Insufficient stock for ${product.title}.` }, { status: 409 });
        }
      } else if (product.stock < item.quantity) {
        return NextResponse.json({ success: false, message: `Insufficient stock for ${product.title}.` }, { status: 409 });
      }
      const price = Number(product.price) + Number(variant?.additionalPrice ?? 0);
      subtotal += price * item.quantity;
      verifiedItems.push({ product, variant, quantity: item.quantity, price });
    }

    // Fees are recalculated on the server; client-supplied totals and prices are never trusted.
    const shippingCharge = deliveryMethod === "express" ? 499 : subtotal >= 4999 ? 0 : 250;
    const giftWrapCharge = body?.giftWrapFee > 0 ? 199 : 0;
    const codFee = paymentMethod === "COD" ? 150 : 0;
    const discountAmount = 0; // Coupons must be validated server-side before being applied.
    const totalAmount = subtotal + shippingCharge + giftWrapCharge + codFee;
    if (paymentMethod === "COD" && totalAmount > 25000) {
      return NextResponse.json({ success: false, message: "Cash on Delivery is limited to orders up to ₹25,000." }, { status: 400 });
    }
    if (paymentMethod === "RAZORPAY") {
      // Confirm with Razorpay itself that the signed payment belongs to this order and exact server total.
      const [gatewayOrder, gatewayPayment] = await Promise.all([
        razorpayInstance.orders.fetch(razorpay_order_id),
        razorpayInstance.payments.fetch(razorpay_payment_id),
      ]);
      if (gatewayOrder.id !== razorpay_order_id || gatewayPayment.order_id !== razorpay_order_id ||
          gatewayPayment.status !== "captured" || Number(gatewayOrder.amount) !== Math.round(totalAmount * 100) ||
          Number(gatewayPayment.amount) !== Math.round(totalAmount * 100) || gatewayOrder.currency !== "INR" || gatewayPayment.currency !== "INR") {
        return NextResponse.json({ success: false, message: "Payment amount or status does not match this order." }, { status: 400 });
      }
    }

    const safeOrderNumber = `PRE-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const order = await prisma.$transaction(async (tx: any) => {
      if (paymentMethod === "RAZORPAY") {
        const existingPayment = await tx.payment.findFirst({ where: { razorpayPaymentId: razorpay_payment_id } });
        if (existingPayment) throw new Error("This payment has already been used for an order.");
      }
      for (const item of verifiedItems) {
        if (item.variant) {
          const update = await tx.productVariant.updateMany({ where: { id: item.variant.id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (update.count !== 1) throw new Error(`Stock changed for ${item.product.title}; please retry.`);
        } else {
          const update = await tx.product.updateMany({ where: { id: item.product.id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (update.count !== 1) throw new Error(`Stock changed for ${item.product.title}; please retry.`);
        }
      }
      return tx.order.create({
        data: {
          orderNumber: safeOrderNumber,
          userId: accountUser?.id ?? null,
          guestEmail: String(customer.email).trim().toLowerCase(),
          guestPhone: String(customer.phone).trim(),
          guestName: String(customer.fullName).trim(),
          subtotal, discountAmount, couponCode: null, shippingCharge, giftWrap: giftWrapCharge > 0,
          giftWrapCharge, giftMessage: giftMessage || null, orderNotes: orderNotes || null,
          totalAmount, paymentMethod, paymentStatus: paymentMethod === "COD" ? "PENDING" : "SUCCESS",
          status: "PLACED", deliveryMethod: deliveryMethod === "express" ? "express" : "standard",
          shippingAddressSnapshot: customer,
          items: { create: verifiedItems.map((item) => ({
            productId: item.product.id, variantId: item.variant?.id ?? null,
            title: item.product.title, sku: item.variant?.sku ?? item.product.sku,
            size: item.variant?.size ?? null, color: item.variant?.color ?? null,
            price: item.price, quantity: item.quantity, totalPrice: item.price * item.quantity,
            image: item.product.images?.[0]?.url ?? null,
          })) },
          timeline: { create: { status: "PLACED", title: "Order Placed", description: "Order placed with PREHERITAGE." } },
          ...(paymentMethod === "RAZORPAY" ? { payment: { create: {
            method: "RAZORPAY", status: "SUCCESS", amount: totalAmount, currency: "INR",
            razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature, paidAt: new Date(),
          } } } : { payment: { create: { method: "COD", status: "PENDING", amount: totalAmount, currency: "INR" } } }),
        },
      });
    });

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (error: any) {
    console.error("Checkout order error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Order could not be saved. Please try again." }, { status: 500 });
  }
}
