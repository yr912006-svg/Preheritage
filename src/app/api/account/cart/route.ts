import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import { getCustomerUser } from "@/lib/account-auth";

async function getAvailable(productId: string, variantId: string | null) {
  const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, include: { variants: true } });
  if (!product) return null;
  if (!variantId) return { product, stock: product.stock, variant: null as null | { id: string; size: string; color: string; additionalPrice: number } };
  const variant = product.variants.find((entry) => entry.id === variantId);
  return variant ? { product, stock: variant.stock, variant } : null;
}

export async function GET() {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to sync your cart." }, { status: 401 });
  try {
    const rows = await prisma.cartItem.findMany({ where: { userId: user.id, product: { status: "ACTIVE" } }, orderBy: { createdAt: "asc" }, include: { product: { include: catalogProductInclude }, variant: true } });
    return NextResponse.json({ items: rows.map((row) => ({
      id: row.id, productId: row.productId, variantId: row.variantId, quantity: row.quantity,
      product: toProductItem(row.product), size: row.variant?.size || "Free Size", color: row.variant?.color || "Original",
      price: row.product.price + (row.variant?.additionalPrice || 0),
      maxStock: row.variant?.stock ?? row.product.stock,
    })) });
  } catch (error) {
    console.error("Customer cart lookup failed:", error);
    return NextResponse.json({ message: "We could not load your saved cart." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to sync your cart." }, { status: 401 });
  try {
    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId : "";
    const variantId = typeof body?.variantId === "string" ? body.variantId : null;
    const quantity = Number(body?.quantity ?? 1);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return NextResponse.json({ message: "Invalid cart item." }, { status: 400 });
    const available = await getAvailable(productId, variantId);
    if (!available || available.stock < 1) return NextResponse.json({ message: "This item is no longer available." }, { status: 409 });
    const existing = await prisma.cartItem.findFirst({ where: { userId: user.id, productId, variantId } });
    const nextQuantity = Math.min((existing?.quantity || 0) + quantity, available.stock, 20);
    const row = existing
      ? await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } })
      : await prisma.cartItem.create({ data: { userId: user.id, productId, variantId, quantity: nextQuantity } });
    return NextResponse.json({ id: row.id, quantity: row.quantity }, { status: 201 });
  } catch (error) {
    console.error("Cart update failed:", error);
    return NextResponse.json({ message: "We could not save this cart item." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to sync your cart." }, { status: 401 });
  try {
    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId : "";
    const variantId = typeof body?.variantId === "string" ? body.variantId : null;
    const quantity = Number(body?.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return NextResponse.json({ message: "Invalid cart quantity." }, { status: 400 });
    const available = await getAvailable(productId, variantId);
    if (!available || available.stock < quantity) return NextResponse.json({ message: "There is not enough stock for that quantity." }, { status: 409 });
    const existing = await prisma.cartItem.findFirst({ where: { userId: user.id, productId, variantId } });
    if (!existing) return NextResponse.json({ message: "Cart item not found." }, { status: 404 });
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart quantity update failed:", error);
    return NextResponse.json({ message: "We could not update this cart item." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Please sign in to sync your cart." }, { status: 401 });
  try {
    const body = await request.json();
    if (body?.clear === true) await prisma.cartItem.deleteMany({ where: { userId: user.id } });
    else if (typeof body?.productId === "string") await prisma.cartItem.deleteMany({ where: { userId: user.id, productId: body.productId, variantId: typeof body.variantId === "string" ? body.variantId : null } });
    else return NextResponse.json({ message: "Invalid cart item." }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart removal failed:", error);
    return NextResponse.json({ message: "We could not update your cart." }, { status: 503 });
  }
}
