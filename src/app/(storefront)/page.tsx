import type { Metadata } from "next";
import HeroBanner from "@/components/home/HeroBanner";
import CulturalStory from "@/components/home/CulturalStory";
import ShopByCategory from "@/components/home/ShopByCategory";
import BestSellers from "@/components/home/BestSellers";
import ShopByRegion from "@/components/home/ShopByRegion";
import Testimonials from "@/components/home/Testimonials";
import SocialFeed from "@/components/home/SocialFeed";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem, StorefrontCategory, StorefrontRegion } from "@/lib/catalog";
import { mergeStorefrontCategories } from "@/lib/category-presentation";
import { CATEGORIES, REGIONS, ProductItem } from "@/lib/sample-data";
import { isPrismaConnectionError, sanitizeDbError } from "@/lib/db-resilience";
import { getHeritagePhilosophy, type HeritagePhilosophyContent } from "@/lib/heritage-philosophy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PREHERITAGE | Wear the Stories of India — Luxury Indian Haute Couture & Handlooms",
  description:
    "Don’t Just Wear Heritage. Carry It Forward. Master-crafted Varanasi Katan silk sarees, Imperial menswear, Kashmir Pashmina shawls, and single-loom treasures direct from Indian master weavers.",
  alternates: {
    canonical: "https://preheritage.com",
  },
  openGraph: {
    title: "PREHERITAGE | Wear the Stories of India",
    description:
      "Don’t Just Wear Heritage. Carry It Forward. Master-crafted Varanasi Katan silk sarees, Imperial menswear, and single-loom treasures.",
    url: "https://preheritage.com",
    images: [
      {
        url: "/images/preheritage-hero.png",
        width: 1536,
        height: 1024,
        alt: "PREHERITAGE — Many Stories. One Thread.",
      },
    ],
  },
};

export default async function HomePage() {
  let products: ProductItem[] = [];
  let categoryCounts: Record<string, number> | null = null;
  let heroBanner: {
    id?: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    mobileUrl?: string | null;
    link: string | null;
    tagline: string | null;
    position?: string | null;
  } | null = null;
  let categories: StorefrontCategory[] = [];
  let regions: StorefrontRegion[] = [];
  let philosophy: HeritagePhilosophyContent | null = null;
  let isDatabaseConnected = true;

  const fallbackCategories: StorefrontCategory[] = CATEGORIES.map((category, orderIndex) => ({
    ...category,
    orderIndex,
  }));

  const fallbackRegions: StorefrontRegion[] = REGIONS.map((region, orderIndex) => ({
    id: `region-${region.slug}`,
    name: region.name,
    slug: region.slug,
    state: region.state,
    craftForm: region.craft,
    culturalStory: region.story,
    bannerImage: region.image,
  }));

  try {
    const now = new Date();

    const [bannerRecord, productRecords, categoryRecords, regionRecords, philosophyRecord] = await Promise.all([
      prisma.banner
        .findFirst({
          where: {
            isActive: true,
            AND: [
              { OR: [{ startDate: null }, { startDate: { lte: now } }] },
              { OR: [{ endDate: null }, { endDate: { gte: now } }] },
            ],
          },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            subtitle: true,
            imageUrl: true,
            mobileUrl: true,
            link: true,
            tagline: true,
            position: true,
          },
        })
        .catch(() => null),
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 8,
        include: catalogProductInclude,
      }),
      prisma.category
        .findMany({
          orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            imageAlt: true,
            focalPoint: true,
            orderIndex: true,
            _count: { select: { products: { where: { status: "ACTIVE" } } } },
          },
        })
        .catch(async () => {
          // Graceful fallback if imageAlt or focalPoint columns are not present in target DB
          return prisma.category
            .findMany({
              orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image: true,
                orderIndex: true,
                _count: { select: { products: { where: { status: "ACTIVE" } } } },
              },
            })
            .then((cats) =>
              cats.map((c) => ({
                ...c,
                imageAlt: null,
                focalPoint: null,
              }))
            )
            .catch(() => []);
        }),
      prisma.region.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          state: true,
          craftForm: true,
          culturalStory: true,
          bannerImage: true,
        },
      }).catch(() => []),
      getHeritagePhilosophy().catch(() => null),
    ]);

    heroBanner = bannerRecord;
    products = productRecords.map(toProductItem);
    categories = mergeStorefrontCategories(categoryRecords, fallbackCategories);
    regions = regionRecords && regionRecords.length > 0 ? regionRecords : fallbackRegions;
    philosophy = philosophyRecord;
    categoryCounts = Object.fromEntries(
      categoryRecords.map((category) => [category.slug, category._count.products])
    );
    isDatabaseConnected = true;
  } catch (error) {
    isDatabaseConnected = !isPrismaConnectionError(error);
    const failureKind = isPrismaConnectionError(error) ? "Connection Failure" : "Query Error";
    console.error(
      `[PREHERITAGE Database] Homepage catalog load encountered ${failureKind}: ${sanitizeDbError(
        error
      )}. Engaging approved static fallbacks.`
    );

    heroBanner = null;
    categories = fallbackCategories;
    regions = fallbackRegions;
    products = [];
    categoryCounts = null;
  }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PREHERITAGE",
    url: "https://preheritage.com",
    logo: "https://preheritage.com/images/official-logo/preheritage-official-logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PREHERITAGE",
    url: "https://preheritage.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://preheritage.com/shop?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* 1. Static Editorial Campaign Hero (PDF 2) */}
      <HeroBanner banner={heroBanner} />

      {/* 2. Brand Philosophy: Artisan Craft & Memoir (PDF 2) */}
      <CulturalStory data={philosophy} />

      {/* 3. Shop by Category: 8 Curated Categories (PDF 2) */}
      <ShopByCategory categories={categories} productCounts={categoryCounts} />

      {/* 4. Timeless Elegance: Featured Product & Vitrine Showcase (PDF 2) */}
      <BestSellers products={products} isDatabaseConnected={isDatabaseConnected} />

      {/* 5. Shop by Cultural Region: 6 Geographic Weaving Looms (PDF 2) */}
      <ShopByRegion regions={regions} />

      {/* 6. Customer Testimonials: Patron Voices Worldwide (PDF 2) */}
      <Testimonials />

      {/* 7. Social Gallery: Follow the Heritage Journey (PDF 2) */}
      <SocialFeed />
    </>
  );
}
