import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import ShopClient from "@/app/shop/ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  try {
    const [products, categories, collections, regions] = await Promise.all([
      prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], include: catalogProductInclude }),
      prisma.category.findMany({ orderBy: [{ orderIndex: "asc" }, { name: "asc" }] }),
      prisma.collection.findMany({ orderBy: { name: "asc" } }),
      prisma.region.findMany({ orderBy: { name: "asc" } }),
    ]);
    return <ShopClient products={products.map(toProductItem)} categories={categories.map(({ id, name, slug }) => ({ id, name, slug }))} collections={collections.map(({ id, name, slug }) => ({ id, name, slug }))} regions={regions.map(({ id, name, slug, state }) => ({ id, name, slug, state }))} />;
  } catch (error) {
    console.error("Product catalogue could not be loaded:", error);
    return <ShopClient products={[]} categories={[]} collections={[]} regions={[]} loadError />;
  }
}
