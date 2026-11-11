import prisma from "@/lib/prisma";
import { razorpayInstance } from "@/lib/razorpay";
import { createCouponValidator } from "@/lib/coupon-service";
import { CheckoutRecoveryError, createCheckoutRecoveryService } from "@/lib/razorpay-checkout-recovery";
import { createRazorpayWebhookHandler } from "@/lib/razorpay-webhook-handler";

export const runtime = "nodejs";

const recovery = createCheckoutRecoveryService({ prisma, validateCouponForOrder: createCouponValidator(prisma) });
const handler = createRazorpayWebhookHandler({
  prisma,
  provider: razorpayInstance,
  webhookSecret: () => process.env.RAZORPAY_WEBHOOK_SECRET,
  markCapturedCheckout: recovery.markCapturedCheckout,
  isRecoveryError: (error): error is CheckoutRecoveryError => error instanceof CheckoutRecoveryError,
});

export const POST = handler;
