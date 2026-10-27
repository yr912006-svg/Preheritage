import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "@/lib/account-auth";
import { getSellableStock } from "@/lib/inventory";

export async function GET() {
  try {
    const access = await requireAdminUser();
    if (!access.admin) return NextResponse.json({ message: access.status === 401 ? "Authentication required." : "Administrator access required." }, { status: access.status });
    const products = await prisma.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { title: "asc" }, select: { id: true, title: true, sku: true, stock: true, status: true, lowStockAlert: true, variants: { select: { id: true, sku: true, size: true, color: true, stock: true } }, images: { orderBy: { orderIndex: "asc" }, take: 1, select: { url: true } } } });
    return NextResponse.json({ inventory: products.map((product) => ({ ...product, stock: getSellableStock(product), image: product.images[0]?.url || "" })) });
  } catch (error) {
    console.error("Admin inventory lookup failed:", error);
    return NextResponse.json({ message: "Could not load inventory." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireAdminUser();
    if (!access.admin) return NextResponse.json({ message: access.status === 401 ? "Authentication required." : "Administrator access required." }, { status: access.status });
    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId : "";
    const variantId = typeof body?.variantId === "string" ? body.variantId : "";
    const delta = Number(body?.delta);
    if (!productId || !Number.isInteger(delta) || Math.abs(delta) !== 1) return NextResponse.json({ message: "Invalid inventory adjustment." }, { status: 400 });
    const current = await prisma.product.findFirst({ where: { id: productId, status: { not: "ARCHIVED" } }, include: { variants: { select: { id: true } } } });
    if (!current) return NextResponse.json({ message: "Product not found." }, { status: 404 });

    let updateCount: number;
    if (current.variants.length) {
      if (!variantId || !current.variants.some((variant) => variant.id === variantId)) return NextResponse.json({ message: "Choose a product variant to adjust its stock." }, { status: 400 });
      const update = await prisma.productVariant.updateMany({ where: { id: variantId, productId, ...(delta < 0 ? { stock: { gte: 1 } } : {}) }, data: { stock: { increment: delta } } });
      updateCount = update.count;
    } else {
      if (variantId) return NextResponse.json({ message: "This product has no variants." }, { status: 400 });
      const update = await prisma.product.updateMany({ where: { id: productId, status: { not: "ARCHIVED" }, ...(delta < 0 ? { stock: { gte: 1 } } : {}) }, data: { stock: { increment: delta } } });
      updateCount = update.count;
    }
    if (!updateCount) return NextResponse.json({ message: delta < 0 ? "Stock cannot go below zero." : "Product not found." }, { status: 409 });
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, stock: true, status: true, lowStockAlert: true, variants: { select: { id: true, sku: true, size: true, color: true, stock: true } } } });
    return NextResponse.json({ product: product && { ...product, stock: getSellableStock(product) } });
  } catch (error) {
    console.error("Inventory adjustment failed:", error);
    return NextResponse.json({ message: "Could not update inventory." }, { status: 503 });
  }
}
