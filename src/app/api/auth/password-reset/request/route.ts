import { NextResponse } from "next/server";
import { createPasswordResetService, hashPasswordResetToken, sendPasswordResetEmail } from "@/lib/password-reset";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const resetService = createPasswordResetService({ prisma, hashPassword: (password) => bcrypt.hash(password, 12) });
const GENERIC_RESPONSE = { message: "If an account matches that email, password reset instructions will be sent shortly." };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json(GENERIC_RESPONSE, { status: 202 });

    const origin = process.env.NEXTAUTH_URL;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!origin || !apiKey || !from) return NextResponse.json(GENERIC_RESPONSE, { status: 202 });

    const reset = await resetService.createReset(email);
    if (reset) {
      const base = new URL(origin);
      const resetUrl = `${base.origin}/reset-password#token=${encodeURIComponent(reset.token)}`;
      let sent = false;
      try { sent = await sendPasswordResetEmail({ email: reset.email, resetUrl, apiKey, from }); } catch { sent = false; }
      if (!sent) await prisma.verificationToken.deleteMany({ where: { token: hashPasswordResetToken(reset.token) } });
    }
    return NextResponse.json(GENERIC_RESPONSE, { status: 202 });
  } catch {
    return NextResponse.json(GENERIC_RESPONSE, { status: 202 });
  }
}
