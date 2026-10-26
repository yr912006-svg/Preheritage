import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true },
      create: { email },
    });

    return NextResponse.json({ success: true, message: "You are subscribed to the PREHERITAGE newsletter." });
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    return NextResponse.json({ success: false, message: "We could not save your subscription. Please try again later." }, { status: 503 });
  }
}
