import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyRazorpaySignature, razorpayInstance } from "@/lib/razorpay";
import { randomUUID } from "crypto";
import { getCustomerUser } from "@/lib/account-auth";
import { calculateCheckoutTotal, calculateShippingCharge, normalizeCheckoutItems } from "@/lib/cart-model";
import { validateCouponForOrder } from "@/lib/coupon-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accountUser = await getCustomerUser();
    const { customer, items, paymentMethod, deliveryMethod, giftMessage, orderNotes, couponCode,
      razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};

    if (!customer?.fullName || !customer?.email || !customer?.phone || !customer?.houseFlat ||
        !customer?.area || !customer?.city || !customer?.state || !/^\d{6}$/.test(String(customer?.pincode ?? ""))) {
      return NextResponse.json({ success: false, message: "Please provide complete and valid delivery details." }, { status: 400 });
    }
    const cart = normalizeCheckoutItems(items);
    if (cart.error) return NextResponse.json({ success: false, message: cart.error }, { status: 400 });
    if (deliveryMethod !== "standard" && deliveryMethod !== "express") return NextResponse.json({ success: false, message: "Choose a valid delivery method." }, { status: 400 });
    if (couponCode !== undefined && couponCode !== null && typeof couponCode !== "string") return NextResponse.json({ success: false, message: "Invalid coupon code." }, { status: 400 });
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

    const normalizedItems = cart.items;
    const ids = Array.from(new Set(normalizedItems.map((item) => item.productId)));
    const products = await prisma.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, include: { images: { orderBy: { orderIndex: "asc" }, take: 1 }, variants: true } });
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
      if (product.variants.length > 0) {
        variant = item.variantId ? product.variants.find((entry: any) => entry.id === item.variantId) : null;
        if (!variant || variant.stock < item.quantity) {
          return NextResponse.json({ success: false, message: `The selected option for ${product.title} is unavailable or out of stock.` }, { status: 409 });
        }
      } else if (item.variantId) {
        return NextResponse.json({ success: false, message: `The selected option for ${product.title} is no longer available.` }, { status: 409 });
      } else if (product.stock < item.quantity) {
        return NextResponse.json({ success: false, message: `Insufficient stock for ${product.title}.` }, { status: 409 });
      }
      const price = Number(product.price) + Number(variant?.additionalPrice ?? 0);
      if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ success: false, message: `The price for ${product.title} could not be verified.` }, { status: 409 });
      subtotal += price * item.quantity;
      verifiedItems.push({ product, variant, quantity: item.quantity, price });
    }

    const couponResult = await validateCouponForOrder({ code: couponCode, subtotal, email: String(customer.email), userId: accountUser?.id });
    if (!couponResult.valid) return NextResponse.json({ success: false, message: couponResult.message }, { status: 400 });

    // Fees and discounts are recalculated from current database prices and coupon rules.
    const shippingCharge = couponResult.freeShipping ? 0 : calculateShippingCharge(subtotal, deliveryMethod);
    const giftWrapCharge = body?.giftWrapFee > 0 ? 199 : 0;
    const codFee = paymentMethod === "COD" ? 150 : 0;
    const discountAmount = couponResult.discountAmount;
    const totalAmount = calculateCheckoutTotal({ subtotal, discountAmount, shippingCharge, giftWrapCharge, codFee });
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
      if (couponResult.coupon) {
        const couponUpdate = await tx.coupon.updateMany({
          where: {
            id: couponResult.coupon.id,
            isActive: true,
            ...(couponResult.coupon.usageLimit !== null ? { usedCount: { lt: couponResult.coupon.usageLimit } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (couponUpdate.count !== 1) throw new Error("This coupon is no longer available. Please retry checkout.");
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
          subtotal, discountAmount, couponCode: couponResult.coupon?.code ?? null, shippingCharge, giftWrap: giftWrapCharge > 0,
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
    return NextResponse.json({ success: false, message: error?.message || "Order could not be saved. Please try again." }, { status: error?.message?.includes("coupon") ? 409 : 500 });
  }
}
