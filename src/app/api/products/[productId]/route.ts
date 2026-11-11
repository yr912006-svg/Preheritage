import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params;
  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: "ACTIVE" },
      include: catalogProductInclude,
    });
    if (!product) return NextResponse.json({ message: "This product is no longer available." }, { status: 404 });
    return NextResponse.json({ product: toProductItem(product) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Public product lookup failed:", error);
    return NextResponse.json({ message: "This product could not be loaded right now." }, { status: 503 });
  }
}
