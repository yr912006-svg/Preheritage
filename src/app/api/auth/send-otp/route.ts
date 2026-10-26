import { NextResponse } from "next/server";
import { sendOtpSms } from "@/lib/sms";
import prisma from "@/lib/prisma";
import { createHash, randomInt } from "crypto";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (typeof phone !== "string") {
      return NextResponse.json({ message: "Mobile phone number is required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    if (!/^\d{10}$/.test(cleanPhone)) return NextResponse.json({ success: false, message: "Enter a valid 10-digit mobile number." }, { status: 400 });

    // Generate 6 digit OTP
    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.$transaction(async (tx) => {
      await tx.phoneOtp.deleteMany({ where: { phone: cleanPhone, expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
      const recentRequests = await tx.phoneOtp.count({ where: { phone: cleanPhone, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } } });
      if (recentRequests >= 5) throw new Error("OTP_REQUEST_LIMIT");
      await tx.phoneOtp.create({
        data: {
          phone: cleanPhone,
          otp: createHash("sha256").update(otp).digest("hex"),
          expiresAt,
        },
      });
    });

    // Send SMS via Fast2SMS, MSG91 or Twilio
    const sendResult = await sendOtpSms(cleanPhone, otp);
    if (!sendResult.success) return NextResponse.json({ success: false, message: sendResult.message }, { status: 503 });

    return NextResponse.json({
      success: true,
      message: sendResult.message,
      ...(process.env.NODE_ENV !== "production" && sendResult.mockOtp ? { mockOtp: sendResult.mockOtp } : {}),
    });
  } catch (error: any) {
    if (error?.message === "OTP_REQUEST_LIMIT") return NextResponse.json({ success: false, message: "Too many verification requests. Please try again later." }, { status: 429 });
    console.error("OTP dispatch failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { message: error?.message || "Failed to dispatch verification code" },
      { status: 500 }
    );
  }
}
