import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";

type Context = { params: { id: string } };

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || ![
      "fullName", "phone", "alternatePhone", "pincode", "houseFlat", "area", "landmark", "city", "state", "country", "isDefault",
    ].every((key) => body[key] === undefined || ["string", "boolean"].includes(typeof body[key]))) {
      return NextResponse.json({ message: "Invalid address details." }, { status: 400 });
    }
    const existing = await prisma.address.findFirst({ where: { id: params.id, userId: user.id } });
    if (!existing) return NextResponse.json({ message: "Address not found." }, { status: 404 });
    const next = { ...existing, ...body };
    if (!validUpdate(next)) return NextResponse.json({ message: "Enter all required address details and a valid Indian PIN code." }, { status: 400 });
    const address = await prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      return tx.address.update({ where: { id: params.id, userId: user.id }, data: {
        fullName: String(next.fullName).trim(), phone: String(next.phone).trim(),
        alternatePhone: next.alternatePhone ? String(next.alternatePhone).trim() : null,
        pincode: String(next.pincode).trim(), houseFlat: String(next.houseFlat).trim(), area: String(next.area).trim(),
        landmark: next.landmark ? String(next.landmark).trim() : null, city: String(next.city).trim(), state: String(next.state).trim(),
        country: String(next.country || "India").trim(), ...(body.isDefault !== undefined ? { isDefault: Boolean(body.isDefault) } : {}),
      } });
    });
    return NextResponse.json({ address });
  } catch (error) {
    console.error("Address update failed:", error);
    return NextResponse.json({ message: "We could not update this address." }, { status: 503 });
  }
}

function validUpdate(body: Record<string, unknown>) {
  return ["fullName", "phone", "pincode", "houseFlat", "area", "city", "state"].every((key) => typeof body[key] === "string" && (body[key] as string).trim()) &&
    /^\d{6}$/.test(String(body.pincode)) && /^[+\d\s()-]{10,20}$/.test(String(body.phone));
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  const address = await prisma.address.findFirst({ where: { id: params.id, userId: user.id } });
  if (!address) return NextResponse.json({ message: "Address not found." }, { status: 404 });
  await prisma.address.delete({ where: { id: address.id } });
  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return NextResponse.json({ success: true });
}
