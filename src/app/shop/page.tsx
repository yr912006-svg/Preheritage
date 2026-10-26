import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import ShopClient from "@/app/shop/ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  try {
    const products = await prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], include: catalogProductInclude });
    return <ShopClient products={products.map(toProductItem)} />;
  } catch (error) {
    console.error("Product catalogue could not be loaded:", error);
    return <ShopClient products={[]} loadError />;
  }
}
