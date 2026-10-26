import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};

    // Never accept mock orders, missing signatures, or placeholder credentials as paid.
    if (
      typeof razorpay_order_id !== "string" || !razorpay_order_id ||
      typeof razorpay_payment_id !== "string" || !razorpay_payment_id ||
      typeof razorpay_signature !== "string" || !razorpay_signature ||
      !process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_KEY_SECRET === "rzp_test_placeholder_secret" ||
      razorpay_order_id.startsWith("order_mock")
    ) {
      return NextResponse.json(
        { success: false, message: "Payment could not be verified. Please complete a real Razorpay payment." },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid payment signature." }, { status: 400 });
    }

    // This endpoint verifies the signature only; order persistence happens separately.
    return NextResponse.json({ success: true, message: "Payment signature verified", paymentId: razorpay_payment_id });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ success: false, message: "Payment verification failed." }, { status: 500 });
  }
}
