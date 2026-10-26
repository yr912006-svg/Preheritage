import HeroBanner from "@/components/home/HeroBanner";
import CulturalStory from "@/components/home/CulturalStory";
import ShopByCategory from "@/components/home/ShopByCategory";
import ShopByRegion from "@/components/home/ShopByRegion";
import BestSellers from "@/components/home/BestSellers";
import Testimonials from "@/components/home/Testimonials";
import SocialFeed from "@/components/home/SocialFeed";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products = [];
  try {
    const records = await prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 8, include: catalogProductInclude });
    products = records.map(toProductItem);
  } catch (error) {
    console.error("Homepage catalogue could not be loaded:", error);
  }
  return (
    <>
      <HeroBanner />
      <CulturalStory />
      <ShopByCategory />
      <BestSellers products={products} />
      <ShopByRegion />
      <Testimonials />
      <SocialFeed />
    </>
  );
}
