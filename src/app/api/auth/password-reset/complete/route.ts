import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createPasswordResetService } from "@/lib/password-reset";

const resetService = createPasswordResetService({ prisma, hashPassword: (password) => bcrypt.hash(password, 12) });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await resetService.completeReset(body?.token, body?.password);
    if (!result.success) return NextResponse.json({ message: "This reset link is invalid or expired. Request a new one and try again." }, { status: 400 });
    return NextResponse.json({ success: true, message: "Password updated. Please sign in with your new password." });
  } catch {
    return NextResponse.json({ message: "Password reset is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
