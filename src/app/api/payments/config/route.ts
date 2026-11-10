import { NextResponse } from "next/server";

function isConfigured(value: string | undefined) {
  return Boolean(value?.trim() && !/placeholder|unconfigured|your_/i.test(value));
}

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const hasKeyId = isConfigured(keyId);
  const hasKeySecret = isConfigured(keySecret);
  const razorpayEnabled = hasKeyId && hasKeySecret;

  const missingConfig: string[] = [];
  if (!hasKeyId) missingConfig.push("RAZORPAY_KEY_ID");
  if (!hasKeySecret) missingConfig.push("RAZORPAY_KEY_SECRET");

  return NextResponse.json(
    {
      razorpayEnabled,
      keyId: razorpayEnabled ? keyId : null,
      missingConfig,
      cashOnDeliveryEnabled: true,
      stripeEnabled: false,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
