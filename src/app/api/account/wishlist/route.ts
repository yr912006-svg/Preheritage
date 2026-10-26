import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import { getCustomerUser } from "@/lib/account-auth";

export async function GET() {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to view your wishlist." }, { status: 401 });
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id, product: { status: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      include: { product: { include: catalogProductInclude } },
    });
    return NextResponse.json({ products: items.map((item) => toProductItem(item.product)) });
  } catch (error) {
    console.error("Customer wishlist lookup failed:", error);
    return NextResponse.json({ message: "We could not load your wishlist." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to save wishlist items." }, { status: 401 });
  try {
    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId : "";
    if (!productId || !(await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } }))) {
      return NextResponse.json({ message: "This product is no longer available." }, { status: 404 });
    }
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: {},
      create: { userId: user.id, productId },
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Wishlist update failed:", error);
    return NextResponse.json({ message: "We could not save this item." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to update your wishlist." }, { status: 401 });
  try {
    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId : "";
    if (!productId) return NextResponse.json({ message: "A product ID is required." }, { status: 400 });
    await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Wishlist removal failed:", error);
    return NextResponse.json({ message: "We could not update your wishlist." }, { status: 503 });
  }
}
