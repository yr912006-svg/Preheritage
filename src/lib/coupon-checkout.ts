export function couponUsageLockKeys(input: { couponCode: string; userId?: string | null; email?: string | null }) {
  const couponCode = input.couponCode.trim().toUpperCase();
  const email = input.email?.trim().toLowerCase();
  return [
    ...(input.userId ? [`coupon:${couponCode}:user:${input.userId}`] : []),
    ...(email ? [`coupon:${couponCode}:email:${email}`] : []),
  ].sort();
}

/**
 * Shared by every order-creation path so a first-order eligibility check is
 * serialized against orders using any coupon (or no coupon at all).
 */
export function customerOrderLockKeys(input: { userId?: string | null; email?: string | null }) {
  const email = input.email?.trim().toLowerCase();
  return [
    ...(input.userId ? [`order-customer:user:${input.userId}`] : []),
    ...(email ? [`order-customer:email:${email}`] : []),
  ].sort();
}

/** Acquires transaction-scoped locks in a stable order before checking/claiming a coupon. */
export async function withCouponUsageLocks<T>(
  keys: string[],
  acquire: (key: string) => Promise<void>,
  operation: () => Promise<T>,
): Promise<T> {
  for (const key of Array.from(new Set(keys)).sort()) await acquire(key);
  return operation();
}
