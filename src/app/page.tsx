import HeroBanner from "@/components/home/HeroBanner";
import CulturalStory from "@/components/home/CulturalStory";
import ShopByCategory from "@/components/home/ShopByCategory";
import ShopByRegion from "@/components/home/ShopByRegion";
import BestSellers from "@/components/home/BestSellers";
import Testimonials from "@/components/home/Testimonials";
import SocialFeed from "@/components/home/SocialFeed";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products = [];
  let categoryCounts: Record<string, number> | null = null;
  try {
    const [records, categories] = await Promise.all([
      prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 8, include: catalogProductInclude }),
      prisma.category.findMany({ select: { slug: true, _count: { select: { products: { where: { status: "ACTIVE" } } } } } }),
    ]);
    products = records.map(toProductItem);
    categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category.slug, 0]));
    for (const category of categories) categoryCounts[category.slug] = category._count.products;
  } catch (error) {
    console.error("Homepage catalogue could not be loaded:", error);
  }
  return (
    <>
      <HeroBanner />
      <CulturalStory />
      <ShopByCategory productCounts={categoryCounts} />
      <BestSellers products={products} />
      <ShopByRegion />
      <Testimonials />
      <SocialFeed />
    </>
  );
}
