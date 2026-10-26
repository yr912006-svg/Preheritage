import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";

function validAddress(body: Record<string, unknown>) {
  const required = ["fullName", "phone", "pincode", "houseFlat", "area", "city", "state"];
  return required.every((field) => typeof body[field] === "string" && (body[field] as string).trim().length > 0) &&
    (body.fullName as string).trim().length <= 100 && /^\d{6}$/.test(body.pincode as string) &&
    /^[+\d\s()-]{10,20}$/.test(body.phone as string);
}

export async function GET() {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return NextResponse.json({ addresses });
}

export async function POST(request: Request) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || !validAddress(body)) return NextResponse.json({ message: "Enter all required address details and a valid Indian PIN code." }, { status: 400 });
    const isDefault = Boolean(body.isDefault) || (await prisma.address.count({ where: { userId: user.id } })) === 0;
    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      return tx.address.create({
        data: {
          userId: user.id,
          fullName: (body.fullName as string).trim(),
          phone: (body.phone as string).trim(),
          alternatePhone: typeof body.alternatePhone === "string" ? body.alternatePhone.trim() || null : null,
          pincode: (body.pincode as string).trim(),
          houseFlat: (body.houseFlat as string).trim(),
          area: (body.area as string).trim(),
          landmark: typeof body.landmark === "string" ? body.landmark.trim() || null : null,
          city: (body.city as string).trim(),
          state: (body.state as string).trim(),
          country: typeof body.country === "string" && body.country.trim() ? body.country.trim() : "India",
          isDefault,
        },
      });
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Address create failed:", error);
    return NextResponse.json({ message: "We could not save this address." }, { status: 503 });
  }
}
