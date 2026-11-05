import { NextResponse } from "next/server";
import { createRazorpayOrder, isRazorpayServerConfigured } from "@/lib/razorpay";
import prisma from "@/lib/prisma";
import { calculateCheckoutTotal, calculateShippingCharge, normalizeCheckoutItems } from "@/lib/cart-model";
import { createCouponValidator } from "@/lib/coupon-service";
import { getCustomerUser } from "@/lib/account-auth";

const validateCouponForOrder = createCouponValidator(prisma);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, deliveryMethod, giftWrap, couponCode, customer, giftMessage, orderNotes } = body ?? {};
    const cart = normalizeCheckoutItems(items);
    if (cart.error) return NextResponse.json({ success: false, message: cart.error }, { status: 400 });
    if (deliveryMethod !== "standard" && deliveryMethod !== "express") return NextResponse.json({ success: false, message: "Choose a valid delivery method." }, { status: 400 });
    if (!customer || !customer.fullName || !customer.email || !customer.phone || !customer.houseFlat || !customer.area || !customer.city || !customer.state || !/^\d{6}$/.test(String(customer.pincode ?? ""))) {
      return NextResponse.json({ success: false, message: "Please provide complete and valid delivery details." }, { status: 400 });
    }
    if (!isRazorpayServerConfigured()) {
      return NextResponse.json({ success: false, message: "Payment gateway is not configured. Please contact the store." }, { status: 503 });
    }

    const ids = Array.from(new Set(cart.items.map((i) => i.productId)));
    const products = await prisma.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, include: { variants: true } });
    if (products.length !== ids.length) return NextResponse.json({ success: false, message: "A cart item is no longer available." }, { status: 409 });
    let subtotal = 0;
    for (const item of cart.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return NextResponse.json({ success: false, message: "A cart item is no longer available." }, { status: 409 });
      const quantity = item.quantity;
      if (product.variants.length > 0) {
        const variant = item.variantId ? product.variants.find((entry) => entry.id === item.variantId) : null;
        if (!variant || variant.stock < quantity) return NextResponse.json({ success: false, message: `The selected option for ${product.title} is unavailable or out of stock.` }, { status: 409 });
        const price = Number(product.price) + Number(variant.additionalPrice);
        if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ success: false, message: "A cart item price could not be verified." }, { status: 409 });
        subtotal += price * quantity;
      } else if (item.variantId) {
        return NextResponse.json({ success: false, message: `The selected option for ${product.title} is no longer available.` }, { status: 409 });
      } else {
        if (product.stock < quantity) return NextResponse.json({ success: false, message: `Insufficient stock for ${product.title}.` }, { status: 409 });
        const price = Number(product.price);
        if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ success: false, message: "A cart item price could not be verified." }, { status: 409 });
        subtotal += price * quantity;
      }
    }
    if (couponCode !== undefined && couponCode !== null && typeof couponCode !== "string") return NextResponse.json({ success: false, message: "Invalid coupon code." }, { status: 400 });
    const accountUser = await getCustomerUser();
    const couponResult = await validateCouponForOrder({ code: couponCode, subtotal, email: String(customer.email), userId: accountUser?.id });
    if (!couponResult.valid) return NextResponse.json({ success: false, message: couponResult.message }, { status: 400 });
    const shippingCharge = couponResult.freeShipping ? 0 : calculateShippingCharge(subtotal, deliveryMethod);
    const total = calculateCheckoutTotal({ subtotal, discountAmount: couponResult.discountAmount, shippingCharge, giftWrapCharge: giftWrap === true ? 199 : 0 });
    const safeCustomer = {
      fullName: String(customer.fullName).trim(), email: String(customer.email).trim().toLowerCase(),
      phone: String(customer.phone).trim(), houseFlat: String(customer.houseFlat).trim(),
      area: String(customer.area).trim(), landmark: String(customer.landmark ?? "").trim(),
      city: String(customer.city).trim(), state: String(customer.state).trim(),
      pincode: String(customer.pincode).trim(), country: String(customer.country ?? "India").trim(),
    };
    const intent = await prisma.razorpayCheckout.create({ data: {
      userId: accountUser?.id ?? null,
      customerEmail: safeCustomer.email,
      amount: total,
      currency: "INR",
      snapshot: {
        customer: safeCustomer,
        items: cart.items.map((item) => ({ productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity })),
        userId: accountUser?.id ?? null,
        couponCode: couponResult.coupon?.code ?? null,
        deliveryMethod,
        giftWrap: giftWrap === true,
        pricing: { subtotal, discountAmount: couponResult.discountAmount, shippingCharge, giftWrapCharge: giftWrap === true ? 199 : 0, totalAmount: total },
        giftMessage: typeof giftMessage === "string" ? giftMessage.slice(0, 500) : null,
        orderNotes: typeof orderNotes === "string" ? orderNotes.slice(0, 1000) : null,
      },
    } });
    const result = await createRazorpayOrder({ amount: total, receipt: intent.id, notes: { checkout_id: intent.id } });

    if (!result.success) {
      await prisma.razorpayCheckout.update({ where: { id: intent.id }, data: { status: "CREATE_FAILED", recoveryReason: "Razorpay order creation failed." } });
      return NextResponse.json({ success: false, message: result.error || "Unable to create payment order" }, { status: 502 });
    }

    await prisma.razorpayCheckout.update({ where: { id: intent.id }, data: { razorpayOrderId: result.order.id } });

    return NextResponse.json({ ...result, checkoutIntentId: intent.id });
  } catch (error: any) {
    console.error("Razorpay order API error:", error);
    return NextResponse.json({ message: error.message || "Failed to create payment" }, { status: 500 });
  }
}
