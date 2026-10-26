import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminUser } from "@/lib/account-auth";

export async function GET() {
  if (!await getAdminUser()) return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  const products = await prisma.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { title: "asc" }, select: { id: true, title: true, sku: true, stock: true, lowStockAlert: true, images: { orderBy: { orderIndex: "asc" }, take: 1, select: { url: true } } } });
  return NextResponse.json({ inventory: products.map((product) => ({ ...product, image: product.images[0]?.url || "" })) });
}

export async function PATCH(request: Request) {
  if (!await getAdminUser()) return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  try {
    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId : "";
    const delta = Number(body?.delta);
    if (!productId || !Number.isInteger(delta) || Math.abs(delta) !== 1) return NextResponse.json({ message: "Invalid inventory adjustment." }, { status: 400 });
    const update = await prisma.product.updateMany({ where: { id: productId, status: { not: "ARCHIVED" }, ...(delta < 0 ? { stock: { gte: 1 } } : {}) }, data: { stock: { increment: delta } } });
    if (!update.count) return NextResponse.json({ message: delta < 0 ? "Stock cannot go below zero." : "Product not found." }, { status: 409 });
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, stock: true, lowStockAlert: true } });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Inventory adjustment failed:", error);
    return NextResponse.json({ message: "Could not update inventory." }, { status: 503 });
  }
}
