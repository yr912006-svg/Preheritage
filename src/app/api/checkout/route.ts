import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyRazorpaySignature, razorpayInstance } from "@/lib/razorpay";
import { randomUUID } from "crypto";
import { getCustomerUser } from "@/lib/account-auth";
import { calculateCheckoutTotal, calculateShippingCharge, normalizeCheckoutItems } from "@/lib/cart-model";
import { createCouponValidator } from "@/lib/coupon-service";
import { couponUsageLockKeys, customerOrderLockKeys, withCouponUsageLocks } from "@/lib/coupon-checkout";
import { paymentReplayMatches } from "@/lib/payment-integrity";
import { CheckoutRecoveryError, createCheckoutRecoveryService } from "@/lib/razorpay-checkout-recovery";
import { createRazorpayBrowserCallback } from "@/lib/razorpay-browser-callback";
import { checkoutIdempotencyDisposition, checkoutRequestFingerprint, isCheckoutIdempotencyKey } from "@/lib/checkout-idempotency";
import { sendCommittedOrderNotification } from "@/lib/order-notifications";
import { checkoutAvailabilityConflict, checkoutNeedsPriceConfirmation, checkoutProductStockGuard, checkoutVariantStockGuard, createCheckoutConfirmationToken, CheckoutPriceRaceConflict, CheckoutStockConflict } from "@/lib/checkout-confirmation";

const validateCouponForOrder = createCouponValidator(prisma);
const checkoutRecovery = createCheckoutRecoveryService({ prisma, validateCouponForOrder });
const finalizeBrowserPayment = createRazorpayBrowserCallback({
  prisma,
  provider: razorpayInstance,
  paymentSecret: () => process.env.RAZORPAY_KEY_SECRET,
  markCapturedCheckout: checkoutRecovery.markCapturedCheckout,
});

export async function POST(req: Request) {
  let checkoutBody: any = null;
  let codAttempt: { key: string; fingerprint: string; identity: { userId: string | null; email: string } } | null = null;
  try {
    const body = checkoutBody = await req.json();
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
    if (paymentMethod === "COD") {
      const key = body?.checkoutIdempotencyKey;
      if (!isCheckoutIdempotencyKey(key)) {
        return NextResponse.json({ success: false, message: "A valid checkout attempt key is required." }, { status: 400 });
      }
      const identity = { userId: accountUser?.id ?? null, email: String(customer.email).trim().toLowerCase() };
      const fingerprint = checkoutRequestFingerprint({
        customer, items: cart.items, deliveryMethod, giftWrap: Number(body?.giftWrapFee) > 0,
        couponCode, giftMessage, orderNotes,
      });
      codAttempt = { key, fingerprint, identity };
      const existing = await prisma.order.findUnique({ where: { checkoutIdempotencyKey: key }, select: {
        id: true, orderNumber: true, userId: true, guestEmail: true, checkoutRequestFingerprint: true,
      } });
      const disposition = checkoutIdempotencyDisposition(existing, identity, fingerprint);
      if (disposition === "replay") return NextResponse.json({ success: true, orderId: existing!.id, orderNumber: existing!.orderNumber, replay: true });
      if (disposition === "conflict") return NextResponse.json({ success: false, message: "This checkout attempt key was already used for different checkout data." }, { status: 409 });
    }
    if (paymentMethod === "RAZORPAY") {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature ||
          !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === "rzp_test_placeholder_secret" ||
          String(razorpay_order_id).startsWith("order_mock") ||
          !verifyRazorpaySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature })) {
        return NextResponse.json({ success: false, message: "A verified Razorpay payment is required before placing this order." }, { status: 400 });
      }
    }

    if (paymentMethod === "RAZORPAY") {
      const callback = await finalizeBrowserPayment({ accountUser, customer, orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
      return callback instanceof NextResponse ? callback : callback.response;
    }

    const normalizedItems = cart.items;
    const ids = Array.from(new Set(normalizedItems.map((item) => item.productId)));
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: { images: { orderBy: { orderIndex: "asc" }, take: 1 }, variants: true } });
    const productMap = new Map(products.map((product: any) => [product.id, product]));

    let subtotal = 0;
    const verifiedItems: any[] = [];
    for (const item of normalizedItems) {
      const product: any = productMap.get(item.productId);
      if (!product) return NextResponse.json({ success: false, code: "ITEM_UNAVAILABLE", message: "An item in your bag is no longer available. Remove it and review your bag." }, { status: 409 });
      let variant: any = null;
      if (product.variants.length > 0) {
        variant = item.variantId ? product.variants.find((entry: any) => entry.id === item.variantId) : null;
      }
      const availabilityConflict = checkoutAvailabilityConflict({
        title: product.title,
        productActive: product.status === "ACTIVE",
        hasVariants: product.variants.length > 0 || Boolean(item.variantId),
        selectedVariantExists: product.variants.length > 0 ? Boolean(variant) : !item.variantId,
        availableStock: variant?.stock ?? product.stock,
        requestedQuantity: item.quantity,
      });
      if (availabilityConflict) return NextResponse.json({ success: false, ...availabilityConflict }, { status: 409 });
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
    const currentPricing = {
      items: verifiedItems.map((item) => ({ productId: item.product.id, variantId: item.variant?.id ?? null, title: item.product.title, quantity: item.quantity, price: item.price })),
      subtotal, discountAmount, shippingCharge, giftWrapCharge, codFee, totalAmount,
    };
    const confirmationContext = {
      couponCode, deliveryMethod,
      customerIdentity: JSON.stringify({
        userId: accountUser?.id ?? null,
        email: String(customer.email).trim().toLowerCase(),
        fullName: String(customer.fullName).trim(),
        phone: String(customer.phone).trim(),
        houseFlat: String(customer.houseFlat).trim(),
        area: String(customer.area).trim(),
        landmark: String(customer.landmark ?? "").trim(),
        city: String(customer.city).trim(),
        state: String(customer.state).trim(),
        pincode: String(customer.pincode).trim(),
        country: String(customer.country ?? "India").trim(),
      }),
      checkoutIdempotencyKey: codAttempt?.key ?? "",
    };
    if (paymentMethod === "COD" && checkoutNeedsPriceConfirmation({
      expected: {
        items: Array.isArray(body?.items) ? body.items : undefined,
        subtotal: body?.subtotal,
        discountAmount: body?.discountAmount,
        shippingCharge: body?.shippingFee,
        giftWrapCharge: body?.giftWrapFee > 0 ? 199 : 0,
        codFee: body?.codFee,
        totalAmount: body?.grandTotal,
      },
      confirmationToken: body?.confirmedPricingToken,
      current: currentPricing,
      context: confirmationContext,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "",
    })) {
      const confirmationSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
      if (!confirmationSecret) return NextResponse.json({ success: false, message: "Checkout cannot verify the updated order total right now. Please try again later." }, { status: 503 });
      const confirmationToken = createCheckoutConfirmationToken({ pricing: currentPricing, context: confirmationContext, secret: confirmationSecret });
      return NextResponse.json({ success: false, code: "PRICE_CHANGED", message: "Prices or order charges changed. Review the updated summary and confirm to continue.", pricing: currentPricing, confirmationToken }, { status: 409 });
    }
    const safeOrderNumber = `PRE-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const order = await prisma.$transaction(async (tx: any) => {
      const identityFilter = [
        ...(accountUser?.id ? [{ userId: accountUser.id }] : []),
        ...(String(customer.email).trim() ? [{ guestEmail: String(customer.email).trim().toLowerCase() }] : []),
      ];
      const orderLocks = customerOrderLockKeys({ userId: accountUser?.id, email: String(customer.email) });
      const couponLocks = couponResult.coupon
        ? couponUsageLockKeys({ couponCode: couponResult.coupon.code, userId: accountUser?.id, email: String(customer.email) })
        : [];
      await withCouponUsageLocks(
        [...orderLocks, ...couponLocks],
        async (key) => { await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0)) IS NULL AS locked`; },
        async () => {
          if (!couponResult.coupon || !identityFilter.length) return;
          const [priorCouponCount, priorOrderCount] = await Promise.all([
            tx.order.count({ where: { couponCode: couponResult.coupon.code, OR: identityFilter } }),
            couponResult.coupon.firstOrderOnly ? tx.order.count({ where: { OR: identityFilter } }) : Promise.resolve(0),
          ]);
          if (couponResult.coupon.usagePerUser > 0 && priorCouponCount >= couponResult.coupon.usagePerUser) {
            throw new Error("COUPON_CUSTOMER_LIMIT");
          }
          if (couponResult.coupon.firstOrderOnly && priorOrderCount > 0) throw new Error("COUPON_FIRST_ORDER_ONLY");
        },
      );
      if (couponResult.coupon) {
        const now = new Date();
        const couponUpdate = await tx.coupon.updateMany({
          where: {
            id: couponResult.coupon.id,
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
            ...(couponResult.coupon.usageLimit !== null ? { usedCount: { lt: couponResult.coupon.usageLimit } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (couponUpdate.count !== 1) throw new Error("This coupon is no longer available. Please retry checkout.");
      }
      for (const item of verifiedItems) {
        if (item.variant) {
          const update = await tx.productVariant.updateMany({
            where: {
              ...checkoutVariantStockGuard({
                variantId: item.variant.id, additionalPrice: item.variant.additionalPrice,
                productPrice: item.product.price, quantity: item.quantity,
              }),
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (update.count !== 1) {
            const latest = await tx.product.findUnique({ where: { id: item.product.id }, select: { status: true, price: true } });
            const latestVariant = await tx.productVariant.findUnique({ where: { id: item.variant.id }, select: { additionalPrice: true } });
            if (latest && (Number(latest.price) !== Number(item.product.price) || (latestVariant && Number(latestVariant.additionalPrice) !== Number(item.variant.additionalPrice)))) throw new CheckoutPriceRaceConflict();
            throw new CheckoutStockConflict(`The selected option for ${item.product.title} is no longer available or just sold out. Update your bag and try again.`);
          }
        } else {
          const update = await tx.product.updateMany({
            where: checkoutProductStockGuard({ productId: item.product.id, price: item.product.price, quantity: item.quantity }),
            data: { stock: { decrement: item.quantity } },
          });
          if (update.count !== 1) {
            const latest = await tx.product.findUnique({ where: { id: item.product.id }, select: { status: true, price: true } });
            if (latest && Number(latest.price) !== Number(item.product.price)) throw new CheckoutPriceRaceConflict();
            throw new CheckoutStockConflict(`${item.product.title} is no longer available or just sold out. Update your bag and try again.`);
          }
        }
      }
      return tx.order.create({
        data: {
          orderNumber: safeOrderNumber,
          ...(codAttempt ? { checkoutIdempotencyKey: codAttempt.key, checkoutRequestFingerprint: codAttempt.fingerprint } : {}),
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
    }, {
      maxWait: 15000,
      timeout: 25000,
    });

    if (paymentMethod === "COD") {
      try { await sendCommittedOrderNotification(prisma, order, "PLACED"); } catch { /* Email cannot change a committed order. */ }
    }
    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (error: any) {
    console.error("Checkout order error:", error);
    if (error instanceof CheckoutRecoveryError) {
      return NextResponse.json({ success: false, message: error.message, recoveryRequired: true }, { status: 409 });
    }
    if (error instanceof CheckoutStockConflict) {
      return NextResponse.json({ success: false, code: "STOCK_CONFLICT", message: error.message }, { status: 409 });
    }
    if (error instanceof CheckoutPriceRaceConflict) {
      return NextResponse.json({ success: false, code: "PRICE_CHANGED", message: error.message }, { status: 409 });
    }
    if (error?.code === "P2002") {
      if (codAttempt) {
        const existing = await prisma.order.findUnique({ where: { checkoutIdempotencyKey: codAttempt.key }, select: {
          id: true, orderNumber: true, userId: true, guestEmail: true, checkoutRequestFingerprint: true,
        } });
        const disposition = checkoutIdempotencyDisposition(existing, codAttempt.identity, codAttempt.fingerprint);
        if (disposition === "replay") return NextResponse.json({ success: true, orderId: existing!.id, orderNumber: existing!.orderNumber, replay: true });
        if (disposition === "conflict") return NextResponse.json({ success: false, message: "This checkout attempt key was already used for different checkout data." }, { status: 409 });
      }
      const paymentId = checkoutBody?.razorpay_payment_id;
      const gatewayOrderId = checkoutBody?.razorpay_order_id;
      if (typeof paymentId === "string" && typeof gatewayOrderId === "string") {
        const prior = await prisma.payment.findFirst({
          where: { OR: [{ razorpayPaymentId: paymentId }, { razorpayOrderId: gatewayOrderId }] },
          include: { order: { select: { id: true, orderNumber: true } } },
        }).catch(() => null);
        if (prior && paymentReplayMatches(prior, { orderId: gatewayOrderId, paymentId }) === "same") {
          return NextResponse.json({ success: true, orderId: prior.order.id, orderNumber: prior.order.orderNumber, replay: true });
        }
      }
      return NextResponse.json({ success: false, message: "This payment is already linked to an order." }, { status: 409 });
    }
    const message = typeof error?.message === "string" && error.message.startsWith("COUPON_")
      ? "This coupon has already been used or is no longer eligible for this customer."
      : "Order could not be saved. Please try again.";
    return NextResponse.json({ success: false, message }, { status: error?.message?.startsWith("COUPON_") ? 409 : 500 });
  }
}
