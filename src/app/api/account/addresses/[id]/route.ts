import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { updateOwnedAddress } from "@/lib/address-management";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  try {
    const body = await request.json();
    const result = await updateOwnedAddress(prisma, user.id, id, body);
    if (result.status === "not-found") return NextResponse.json({ message: "Address not found." }, { status: 404 });
    if (result.status === "invalid") return NextResponse.json({ message: "Enter valid address details and a valid Indian PIN code." }, { status: 400 });
    return NextResponse.json({ address: result.address });
  } catch (error) {
    console.error("Address update failed:", error);
    return NextResponse.json({ message: "We could not update this address." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return NextResponse.json({ message: "Address not found." }, { status: 404 });
  await prisma.address.delete({ where: { id: address.id } });
  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return NextResponse.json({ success: true });
}
