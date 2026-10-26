import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";

export async function GET() {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to view your account." }, { status: 401 });
  return NextResponse.json({ profile: { ...user, dob: user.dob?.toISOString().slice(0, 10) ?? "" } });
}

export async function PATCH(request: Request) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to update your account." }, { status: 401 });

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phoneText = typeof body.phone === "string" ? body.phone.trim() : "";
    const phoneDigits = phoneText.replace(/\D/g, "");
    const phone = phoneDigits ? phoneDigits.slice(-10) : null;
    const gender = typeof body.gender === "string" ? body.gender.trim() : "";
    const dobText = typeof body.dob === "string" ? body.dob.trim() : "";
    const dob = dobText ? new Date(`${dobText}T00:00:00.000Z`) : null;

    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        (phoneText && (!/^\+?[\d\s()-]+$/.test(phoneText) || !/^\d{10}$/.test(phone || ""))) ||
        (gender && !["Female", "Male", "Non-binary", "Prefer not to say"].includes(gender)) ||
        (dobText && (!/^\d{4}-\d{2}-\d{2}$/.test(dobText) || !dob || Number.isNaN(dob.valueOf()) || dob > new Date()))) {
      return NextResponse.json({ message: "Please check your name, email, phone, gender, and date of birth." }, { status: 400 });
    }

    const emailOwner = await prisma.user.findFirst({ where: { email, id: { not: user.id } }, select: { id: true } });
    if (emailOwner) return NextResponse.json({ message: "That email is already in use." }, { status: 409 });
    if (phone) {
      const phoneOwner = await prisma.user.findFirst({ where: { phone, id: { not: user.id } }, select: { id: true } });
      if (phoneOwner) return NextResponse.json({ message: "That phone number is already in use." }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name, email, phone, gender: gender || null, dob },
      select: { id: true, name: true, email: true, phone: true, gender: true, dob: true, image: true },
    });
    return NextResponse.json({ profile: { ...updated, dob: updated.dob?.toISOString().slice(0, 10) ?? "" } });
  } catch (error) {
    console.error("Account profile update failed:", error);
    return NextResponse.json({ message: "We could not save your profile. Please try again." }, { status: 503 });
  }
}
