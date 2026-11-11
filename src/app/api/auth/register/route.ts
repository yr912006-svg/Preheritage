import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { CUSTOMER_PASSWORD_POLICY_MESSAGE, isValidCustomerPassword } from "@/lib/customer-password-policy";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const registerLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, prefix: "register" });

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = await registerLimiter.check(ip);
    if (!limit.success) {
      return NextResponse.json(
        { success: false, message: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const digits = phoneRaw.replace(/\D/g, "");
    const phone = digits ? digits.slice(-10) : null;
    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !isValidCustomerPassword(password) || (phoneRaw && (!/^\d{10}$/.test(phone || "") || !/^\+?[\d\s()-]+$/.test(phoneRaw)))) {
      return NextResponse.json({ success: false, message: `Enter a valid name, email, phone number, and password. ${CUSTOMER_PASSWORD_POLICY_MESSAGE}` }, { status: 400 });
    }
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] } });
    if (existing) return NextResponse.json({ success: false, message: "An account with this email or mobile phone already exists." }, { status: 409 });
    const user = await prisma.user.create({ data: { name, email, phone, passwordHash: await bcrypt.hash(password, 12), role: "CUSTOMER" } });
    return NextResponse.json({ success: true, message: "Patron account created successfully", user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("Registration request failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ success: false, message: "Registration could not be completed. Please try again later." }, { status: 503 });
  }
}
