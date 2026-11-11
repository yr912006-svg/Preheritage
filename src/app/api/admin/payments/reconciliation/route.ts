import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { razorpayInstance } from "@/lib/razorpay";
import { createCheckoutRecoveryService } from "@/lib/razorpay-checkout-recovery";
import { createCouponValidator } from "@/lib/coupon-service";
import { createAdminPaymentReconciliationRoutes } from "@/lib/admin-payment-reconciliation";

const recovery = createCheckoutRecoveryService({ prisma, validateCouponForOrder: createCouponValidator(prisma) });
const handlers = createAdminPaymentReconciliationRoutes({
  prisma,
  authorize: requireAdminCapability,
  provider: razorpayInstance,
  finalizeCapturedCheckout: recovery.finalizeCapturedCheckout,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
