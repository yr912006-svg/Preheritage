import Razorpay from "razorpay";
import crypto from "crypto";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "unconfigured";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "unconfigured";

export const razorpayInstance = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export interface CreateOrderParams {
  amount: number; // in INR
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder({
  amount,
  currency = "INR",
  receipt,
  notes = {},
}: CreateOrderParams) {
  try {
    // Razorpay requires amount in the smallest currency unit (paise for INR)
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes: {
        brand: "PREHERITAGE",
        ...notes,
      },
    };

    const order = await razorpayInstance.orders.create(options);
    return { success: true, order };
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return { success: false, error: error?.message || "Failed to create Razorpay order" };
  }
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(text)
      .digest("hex");

    const actual = Buffer.from(signature, "hex");
    const expected = Buffer.from(generatedSignature, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
