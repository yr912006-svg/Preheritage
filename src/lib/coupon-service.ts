import prisma from "@/lib/prisma";
import { calculateCouponDiscount } from "@/lib/cart-model";

export async function validateCouponForOrder(input: {
  code?: string | null;
  subtotal: number;
  email: string;
  userId?: string | null;
}) {
  const code = input.code?.trim().toUpperCase();
  if (!code) return { valid: true as const, coupon: null, discountAmount: 0, freeShipping: false };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  const now = new Date();
  const email = input.email.trim().toLowerCase();
  if (!coupon || !coupon.isActive || coupon.startDate > now || coupon.endDate < now ||
      input.subtotal < coupon.minOrderValue || (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)) {
    return { valid: false as const, message: "This coupon is invalid, expired, or not eligible for this order." };
  }

  const identityFilter = [
    ...(input.userId ? [{ userId: input.userId }] : []),
    ...(email ? [{ guestEmail: email }] : []),
  ];
  if (coupon.firstOrderOnly && identityFilter.length) {
    const priorOrderCount = await prisma.order.count({ where: { OR: identityFilter } });
    if (priorOrderCount > 0) return { valid: false as const, message: "This offer is only available on a first order." };
  }
  if (identityFilter.length && coupon.usagePerUser > 0) {
    const priorCouponCount = await prisma.order.count({ where: { couponCode: code, OR: identityFilter } });
    if (priorCouponCount >= coupon.usagePerUser) return { valid: false as const, message: "This coupon has already been used the maximum number of times." };
  }

  const discountType = coupon.discountType === "PERCENTAGE" ? "PERCENT" : coupon.discountType === "FIXED" ? "FIXED" : null;
  if (!discountType) return { valid: false as const, message: "This coupon is not configured for checkout." };
  const discountAmount = calculateCouponDiscount({
    code,
    type: discountType,
    discount: coupon.discountValue,
    minimumOrderValue: coupon.minOrderValue,
    maxDiscount: coupon.maxDiscount ?? undefined,
  }, input.subtotal);
  if (discountAmount <= 0 && !coupon.freeShipping) {
    return { valid: false as const, message: "This coupon does not apply to the current bag total." };
  }
  return { valid: true as const, coupon, discountAmount, freeShipping: coupon.freeShipping };
}
