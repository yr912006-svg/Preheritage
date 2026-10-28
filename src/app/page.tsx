import HeroBanner from "@/components/home/HeroBanner";
import CulturalStory from "@/components/home/CulturalStory";
import ShopByCategory from "@/components/home/ShopByCategory";
import ShopByRegion from "@/components/home/ShopByRegion";
import BestSellers from "@/components/home/BestSellers";
import Testimonials from "@/components/home/Testimonials";
import SocialFeed from "@/components/home/SocialFeed";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import { mergeStorefrontCategories } from "@/lib/category-presentation";
import { CATEGORIES } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products = [];
  let categoryCounts: Record<string, number> | null = null;
  let categories: { id: string; name: string; slug: string; description: string | null; image: string | null; orderIndex: number }[] = [];
  let regions: { id: string; name: string; slug: string; state: string; craftForm: string; culturalStory: string; bannerImage: string | null }[] = [];
  const fallbackCategories = CATEGORIES.map((category, orderIndex) => ({ ...category, orderIndex }));
  try {
    const [records, categoryRecords, regionRecords] = await Promise.all([
      prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 8, include: catalogProductInclude }),
      prisma.category.findMany({ orderBy: [{ orderIndex: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true, description: true, image: true, orderIndex: true, _count: { select: { products: { where: { status: "ACTIVE" } } } } } }),
      prisma.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, state: true, craftForm: true, culturalStory: true, bannerImage: true } }),
    ]);
    products = records.map(toProductItem);
    categories = mergeStorefrontCategories(categoryRecords, fallbackCategories);
    regions = regionRecords;
    categoryCounts = Object.fromEntries(categoryRecords.map((category) => [category.slug, category._count.products]));
  } catch (error) {
    console.error("Homepage catalogue could not be loaded:", error);
    categories = fallbackCategories;
  }
  return (
    <>
      <HeroBanner />
      <CulturalStory />
      <ShopByCategory categories={categories} productCounts={categoryCounts} />
      <BestSellers products={products} />
      <ShopByRegion regions={regions} />
      <Testimonials />
      <SocialFeed />
    </>
  );
}
