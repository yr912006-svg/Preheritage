import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";

// Lightweight per-process abuse guard, paired with a honeypot and strict input limits.
const submissions = new Map<string, number[]>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.website === "string" && body.website.trim()) return NextResponse.json({ success: true });
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      phone.length > 40 || (phone && !/^\+?[\d\s()\-.]{7,40}$/.test(phone)) || subject.length < 2 || subject.length > 160 || message.length < 10 || message.length > 5000) {
      return NextResponse.json({ message: "Please check your name, contact details, subject, and message." }, { status: 400 });
    }
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const key = forwarded || "unknown";
    const now = Date.now();
    const recent = (submissions.get(key) || []).filter((time) => now - time < 10 * 60_000);
    if (recent.length >= 5) return NextResponse.json({ message: "Please wait before sending another inquiry." }, { status: 429 });
    recent.push(now); submissions.set(key, recent);

    const customer = await getCustomerUser();
    const inquiry = await prisma.supportTicket.create({ data: {
      guestName: name, guestEmail: email, ...(phone ? { guestPhone: phone } : {}), subject, message,
      category: "GENERAL", status: "OPEN", ...(customer ? { userId: customer.id } : {}),
    }, select: { id: true } });
    return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 });
  } catch (error) {
    console.error("Customer inquiry submission failed:", error);
    return NextResponse.json({ message: "We could not save your inquiry. Please try again." }, { status: 503 });
  }
}
