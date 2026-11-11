import Razorpay from "razorpay";
import { verifyRazorpayHmac } from "@/lib/payment-integrity";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "unconfigured";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "unconfigured";

export const razorpayInstance = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export function isRazorpayServerConfigured(
  keyId: string | undefined = process.env.RAZORPAY_KEY_ID,
  keySecret: string | undefined = process.env.RAZORPAY_KEY_SECRET,
): boolean {
  return Boolean(keyId && keySecret && keyId !== "rzp_test_placeholder" && keySecret !== "rzp_test_placeholder_secret");
}

export interface CreateOrderParams {
  amount: number; // in INR
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export function createRazorpayOrderService(provider: { orders: { create(options: any): Promise<any> } }) {
  return async function createOrder({ amount, currency = "INR", receipt, notes = {} }: CreateOrderParams) {
    try {
      // Razorpay requires amount in the smallest currency unit (paise for INR)
      const options = {
        amount: Math.round(amount * 100),
        currency,
        receipt,
        notes: { brand: "PREHERITAGE", ...notes },
      };

      const order = await provider.orders.create(options);
      return { success: true, order };
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);
      return { success: false, error: error?.message || "Failed to create Razorpay order" };
    }
  };
}

export const createRazorpayOrder = createRazorpayOrderService(razorpayInstance);

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  return verifyRazorpayHmac(orderId, paymentId, signature, razorpayKeySecret);
}
