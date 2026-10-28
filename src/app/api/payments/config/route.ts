import { NextResponse } from "next/server";

function isConfigured(value: string | undefined) {
  return Boolean(value?.trim() && !/placeholder|unconfigured|your_/i.test(value));
}

export async function GET() {
  const razorpayEnabled = isConfigured(process.env.RAZORPAY_KEY_ID) &&
    isConfigured(process.env.RAZORPAY_KEY_SECRET) &&
    isConfigured(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  return NextResponse.json({ razorpayEnabled, cashOnDeliveryEnabled: true, stripeEnabled: false }, { headers: { "Cache-Control": "no-store" } });
}
