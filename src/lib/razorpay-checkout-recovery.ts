import { randomUUID } from "crypto";
import { calculateCheckoutTotal, calculateShippingCharge, normalizeCheckoutItems } from "@/lib/cart-model";
import { couponUsageLockKeys, customerOrderLockKeys, withCouponUsageLocks } from "@/lib/coupon-checkout";
import { checkoutPricingMatches, finalizedCheckoutDisposition, isCapturedPaymentForOrder, isVerifiedPaymentIdConflict } from "@/lib/payment-integrity";

type CheckoutSnapshot = {
  customer: Record<string, any>;
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>;
  userId: string | null;
  couponCode: string | null;
  deliveryMethod: "standard" | "express";
  giftWrap: boolean;
  giftMessage: string | null;
  orderNotes: string | null;
  pricing: { subtotal: number; discountAmount: number; shippingCharge: number; giftWrapCharge: number; totalAmount: number };
};

export class CheckoutRecoveryError extends Error {
  readonly code: string;
  constructor(message: string, code: string) { super(message); this.name = "CheckoutRecoveryError"; this.code = code; }
}

export function createCheckoutRecoveryService(deps: {
  prisma: any;
  validateCouponForOrder: (input: { code?: string | null; subtotal: number; email: string; userId?: string | null }) => Promise<any>;
  now?: () => Date;
  newId?: () => string;
  hooks?: {
    afterCouponClaim?: () => Promise<void> | void;
    afterStockUpdates?: () => Promise<void> | void;
    afterOrderCreated?: (order: any) => Promise<void> | void;
  };
}) {
const { prisma, validateCouponForOrder } = deps;
const now = deps.now ?? (() => new Date());
const newId = deps.newId ?? randomUUID;

async function markCapturedCheckout(input: {
  intentId: string;
  order: any;
  payment: any;
}) {
  const intent = await prisma.razorpayCheckout.findUnique({ where: { id: input.intentId } });
  if (!intent) throw new CheckoutRecoveryError("Checkout record was not found.", "INTENT_NOT_FOUND");
  if (!isCapturedPaymentForOrder(input.order, input.payment) || input.order.id !== intent.razorpayOrderId ||
      Number(input.payment.amount) !== Math.round(intent.amount * 100) || input.order.currency !== intent.currency) {
    throw new CheckoutRecoveryError("Captured payment does not match the recorded checkout amount or order.", "PAYMENT_MISMATCH");
  }
  if (intent.status === "FINALIZED") return finalizeCapturedCheckout(intent.id, input.order, input.payment);
  if (intent.razorpayPaymentId && intent.razorpayPaymentId !== input.payment.id) {
    throw new CheckoutRecoveryError("A different payment is already associated with this checkout.", "PAYMENT_ID_CONFLICT");
  }
  try {
    await prisma.razorpayCheckout.updateMany({
      where: { id: intent.id, status: { not: "FINALIZED" }, OR: [{ razorpayPaymentId: null }, { razorpayPaymentId: input.payment.id }] },
      data: { razorpayPaymentId: input.payment.id, status: "CAPTURED", recoveryReason: null },
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      // Verify the owner before treating a uniqueness error as a durable payment collision.
      // Lookup/update failures intentionally propagate as transient errors for webhook retry.
      const owner = await prisma.razorpayCheckout.findUnique({ where: { razorpayPaymentId: input.payment.id }, select: { id: true } });
      if (isVerifiedPaymentIdConflict(error, intent.id, owner?.id ?? null)) {
        await prisma.razorpayCheckout.updateMany({
          where: { id: intent.id, status: { not: "FINALIZED" } },
          data: { status: "RECOVERY_REQUIRED", recoveryReason: `PAYMENT_ID_CONFLICT: payment is already attached to checkout ${owner.id}; manual review required.`, recoveryAttempts: { increment: 1 } },
        });
        throw new CheckoutRecoveryError("This captured payment is already associated with another checkout and requires manual review.", "PAYMENT_ID_CONFLICT");
      }
    }
    throw error;
  }
  return finalizeCapturedCheckout(intent.id, input.order, input.payment);
}

async function finalizeCapturedCheckout(intentId: string, gatewayOrder: any, gatewayPayment: any) {
  const intent = await prisma.razorpayCheckout.findUnique({ where: { id: intentId } });
  if (!intent) throw new CheckoutRecoveryError("Checkout record was not found.", "INTENT_NOT_FOUND");
  const finalizedDisposition = finalizedCheckoutDisposition(intent.status, intent.orderId);
  if (finalizedDisposition !== "continue") {
    if (finalizedDisposition === "replay" && intent.orderId) {
      const order = await prisma.order.findUnique({ where: { id: intent.orderId }, select: { id: true, orderNumber: true } });
      if (order) return { ...order, replay: true };
    }
    const reason = "FINALIZED_ORDER_MISSING: checkout is finalized but its order link is unavailable; manual review required.";
    await prisma.razorpayCheckout.updateMany({
      where: { id: intent.id, status: "FINALIZED" },
      data: { recoveryReason: reason },
    });
    throw new CheckoutRecoveryError("The checkout is finalized but its order is unavailable. Manual review is required.", "FINALIZED_ORDER_MISSING");
  }
  if (!isCapturedPaymentForOrder(gatewayOrder, gatewayPayment) || gatewayOrder.id !== intent.razorpayOrderId ||
      gatewayPayment.id !== intent.razorpayPaymentId || Number(gatewayPayment.amount) !== Math.round(intent.amount * 100) ||
      gatewayOrder.currency !== intent.currency) {
    throw new CheckoutRecoveryError("Razorpay's current captured payment does not match the checkout record.", "PAYMENT_MISMATCH");
  }

  try {
    const snapshot = intent.snapshot as unknown as CheckoutSnapshot;
    const customer = snapshot.customer;
    if (!customer || String(customer.email).trim().toLowerCase() !== intent.customerEmail) {
      throw new CheckoutRecoveryError("Saved customer details do not match the checkout identity.", "INVALID_SNAPSHOT");
    }
    if (intent.userId) {
      const owner = await prisma.user.findFirst({ where: { id: intent.userId, role: "CUSTOMER", isActive: true }, select: { id: true } });
      if (!owner) throw new CheckoutRecoveryError("The customer account is no longer eligible for checkout.", "CUSTOMER_INACTIVE");
    }
    const cart = normalizeCheckoutItems(snapshot.items);
    if (cart.error) throw new CheckoutRecoveryError("The saved checkout items are invalid.", "INVALID_SNAPSHOT");
    const ids = Array.from(new Set(cart.items.map((line) => line.productId)));
    const products = await prisma.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, include: { images: { orderBy: { orderIndex: "asc" }, take: 1 }, variants: true } });
    if (products.length !== ids.length) throw new CheckoutRecoveryError("A product is no longer available.", "PRODUCT_UNAVAILABLE");
    const productMap = new Map(products.map((product: any) => [product.id, product]));
    const verifiedItems: any[] = [];
    let subtotal = 0;
    for (const line of cart.items) {
      const product: any = productMap.get(line.productId);
      const variant = product.variants.length ? product.variants.find((candidate: any) => candidate.id === line.variantId) : null;
      if ((product.variants.length && !variant) || (!product.variants.length && line.variantId)) {
        throw new CheckoutRecoveryError(`A selected product option is no longer available (${product.title}).`, "VARIANT_UNAVAILABLE");
      }
      const price = Number(product.price) + Number(variant?.additionalPrice ?? 0);
      if (!Number.isFinite(price) || price <= 0) throw new CheckoutRecoveryError("A product price could not be verified.", "PRICE_INVALID");
      subtotal += price * line.quantity;
      verifiedItems.push({ product, variant, quantity: line.quantity, price });
    }
    const coupon = await validateCouponForOrder({ code: snapshot.couponCode, subtotal, email: intent.customerEmail, userId: intent.userId });
    if (!coupon.valid) throw new CheckoutRecoveryError(coupon.message, "COUPON_INELIGIBLE");
    const shippingCharge = coupon.freeShipping ? 0 : calculateShippingCharge(subtotal, snapshot.deliveryMethod);
    const giftWrapCharge = snapshot.giftWrap ? 199 : 0;
    const totalAmount = calculateCheckoutTotal({ subtotal, discountAmount: coupon.discountAmount, shippingCharge, giftWrapCharge });
    const currentPricing = { subtotal, discountAmount: coupon.discountAmount, shippingCharge, giftWrapCharge, totalAmount };
    if (Math.round(totalAmount * 100) !== Number(gatewayPayment.amount) ||
        Math.round(Number(snapshot.pricing.totalAmount) * 100) !== Math.round(intent.amount * 100) ||
        !checkoutPricingMatches(snapshot.pricing, currentPricing)) {
      throw new CheckoutRecoveryError("Current prices or coupon rules no longer match the captured amount.", "AMOUNT_CHANGED");
    }

    const email = String(customer.email).trim().toLowerCase();
    const order = await prisma.$transaction(async (tx: any) => {
      // Serialize finalizers for this checkout. Under PostgreSQL READ COMMITTED,
      // a waiter sees the committed FINALIZED row after the owner releases it.
      const lockedRows = await tx.$queryRaw<Array<{ status: string; orderId: string | null }>>`
        SELECT "status", "orderId" FROM "razorpay_checkouts" WHERE "id" = ${intent.id} FOR UPDATE
      `;
      const lockedCheckout = lockedRows[0];
      if (!lockedCheckout) throw new CheckoutRecoveryError("Checkout record was not found.", "INTENT_NOT_FOUND");
      if (lockedCheckout.status === "FINALIZED") {
        if (lockedCheckout.orderId) {
          const finalizedOrder = await tx.order.findUnique({ where: { id: lockedCheckout.orderId }, select: { id: true, orderNumber: true } });
          if (finalizedOrder) return { ...finalizedOrder, replay: true };
        }
        throw new CheckoutRecoveryError("The checkout is finalized but its order is unavailable. Manual review is required.", "FINALIZED_ORDER_MISSING");
      }
      const identityFilter = [
        ...(intent.userId ? [{ userId: intent.userId }] : []),
        ...(email ? [{ guestEmail: email }] : []),
      ];
      const orderLocks = customerOrderLockKeys({ userId: intent.userId, email });
      const couponLocks = coupon.coupon
        ? couponUsageLockKeys({ couponCode: coupon.coupon.code, userId: intent.userId, email })
        : [];
      await withCouponUsageLocks(
        [...orderLocks, ...couponLocks],
        async (key) => { await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0)) IS NULL AS locked`; },
        async () => {
          if (!coupon.coupon || !identityFilter.length) return;
          const [count, firstOrderCount] = await Promise.all([
            tx.order.count({ where: { couponCode: coupon.coupon.code, OR: identityFilter } }),
            coupon.coupon.firstOrderOnly ? tx.order.count({ where: { OR: identityFilter } }) : Promise.resolve(0),
          ]);
          if (coupon.coupon.usagePerUser > 0 && count >= coupon.coupon.usagePerUser) throw new CheckoutRecoveryError("Customer coupon limit has been reached.", "COUPON_CUSTOMER_LIMIT");
          if (coupon.coupon.firstOrderOnly && firstOrderCount > 0) throw new CheckoutRecoveryError("Coupon is restricted to a first order.", "COUPON_FIRST_ORDER_ONLY");
        },
      );
      if (coupon.coupon) {
        const update = await tx.coupon.updateMany({
          where: { id: coupon.coupon.id, isActive: true, startDate: { lte: now() }, endDate: { gte: now() }, ...(coupon.coupon.usageLimit !== null ? { usedCount: { lt: coupon.coupon.usageLimit } } : {}) },
          data: { usedCount: { increment: 1 } },
        });
        if (update.count !== 1) throw new CheckoutRecoveryError("Coupon is no longer available.", "COUPON_UNAVAILABLE");
        await deps.hooks?.afterCouponClaim?.();
      }
      for (const line of verifiedItems) {
        const update = line.variant
          ? await tx.productVariant.updateMany({ where: { id: line.variant.id, stock: { gte: line.quantity } }, data: { stock: { decrement: line.quantity } } })
          : await tx.product.updateMany({ where: { id: line.product.id, stock: { gte: line.quantity } }, data: { stock: { decrement: line.quantity } } });
        if (update.count !== 1) throw new CheckoutRecoveryError(`Stock changed for ${line.product.title}.`, "STOCK_CONFLICT");
      }
      await deps.hooks?.afterStockUpdates?.();
      const created = await tx.order.create({ data: {
        orderNumber: `PRE-${now().getTime()}-${newId().slice(0, 8).toUpperCase()}`,
        userId: intent.userId, guestEmail: email, guestPhone: String(customer.phone).trim(), guestName: String(customer.fullName).trim(),
        subtotal, discountAmount: coupon.discountAmount, couponCode: coupon.coupon?.code ?? null, shippingCharge,
        giftWrap: snapshot.giftWrap, giftWrapCharge, giftMessage: snapshot.giftMessage, orderNotes: snapshot.orderNotes,
        totalAmount, paymentMethod: "RAZORPAY", paymentStatus: "SUCCESS", status: "PLACED", deliveryMethod: snapshot.deliveryMethod,
        shippingAddressSnapshot: customer,
        items: { create: verifiedItems.map((line) => ({ productId: line.product.id, variantId: line.variant?.id ?? null,
          title: line.product.title, sku: line.variant?.sku ?? line.product.sku, size: line.variant?.size ?? null,
          color: line.variant?.color ?? null, price: line.price, quantity: line.quantity, totalPrice: line.price * line.quantity,
          image: line.product.images?.[0]?.url ?? null })) },
        timeline: { create: { status: "PLACED", title: "Order Placed", description: "Order placed with PREHERITAGE." } },
        payment: { create: { method: "RAZORPAY", status: "SUCCESS", amount: totalAmount, currency: "INR",
          razorpayOrderId: intent.razorpayOrderId, razorpayPaymentId: gatewayPayment.id, paidAt: now() } },
      } });
      await deps.hooks?.afterOrderCreated?.(created);
      await tx.razorpayCheckout.update({ where: { id: intent.id }, data: { status: "FINALIZED", orderId: created.id, recoveryReason: null } });
      return created;
    });
    return order;
  } catch (error: any) {
    if (error?.code === "P2002") {
      const existing = await prisma.payment.findFirst({ where: { razorpayOrderId: intent.razorpayOrderId, razorpayPaymentId: gatewayPayment.id }, include: { order: { select: { id: true, orderNumber: true } } } });
      if (existing) {
        await prisma.razorpayCheckout.update({ where: { id: intent.id }, data: { status: "FINALIZED", orderId: existing.order.id, recoveryReason: null } });
        return { ...existing.order, replay: true };
      }
    }
    const reason = error instanceof Error ? error.message.slice(0, 500) : "Unknown finalization failure";
    if (error instanceof CheckoutRecoveryError && error.code === "FINALIZED_ORDER_MISSING") {
      await prisma.razorpayCheckout.updateMany({ where: { id: intent.id, status: "FINALIZED" }, data: { recoveryReason: reason } });
    }
    await prisma.razorpayCheckout.updateMany({ where: { id: intent.id, status: { not: "FINALIZED" } }, data: { status: "RECOVERY_REQUIRED", recoveryReason: reason, recoveryAttempts: { increment: 1 } } }).catch(() => {});
    if (error instanceof CheckoutRecoveryError) throw error;
    throw new CheckoutRecoveryError("Captured payment requires manual reconciliation.", "FINALIZATION_FAILED");
  }
}

return { markCapturedCheckout, finalizeCapturedCheckout };
}
