import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import { CATEGORIES, REGIONS } from "@/lib/sample-data";
import { sanitizeDbError } from "@/lib/db-resilience";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Handcrafted Indian Luxury Sarees & Heritage Collections | PREHERITAGE",
  description:
    "Explore authentic Varanasi Katan silk sarees, Kashmir Pashmina shawls, Chanderi kurtas, and artisanal Indian handlooms curated by PREHERITAGE.",
  openGraph: {
    title: "Handcrafted Indian Luxury Sarees & Heritage Collections | PREHERITAGE",
    description:
      "Explore authentic Varanasi Katan silk sarees, Kashmir Pashmina shawls, Chanderi kurtas, and artisanal Indian handlooms curated by PREHERITAGE.",
    url: "https://preheritage.com/shop",
  },
  alternates: {
    canonical: "https://preheritage.com/shop",
  },
};

export default async function ShopPage() {
  try {
    const [dbProducts, dbCategories, dbCollections, dbRegions] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: catalogProductInclude,
      }),
      prisma.category
        .findMany({
          orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
          select: { id: true, name: true, slug: true },
        })
        .catch(() => []),
      prisma.collection
        .findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true },
        })
        .catch(() => []),
      prisma.region
        .findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true, state: true },
        })
        .catch(() => []),
    ]);

    // Merge categories with master catalog categories so all 8 official collections are filterable
    const presentCategorySlugs = new Set(dbCategories.map((c) => c.slug));
    const mergedCategories = [
      ...dbCategories.map(({ id, name, slug }) => ({ id, name, slug })),
      ...CATEGORIES.filter((c) => !presentCategorySlugs.has(c.slug)).map(({ id, name, slug }) => ({ id, name, slug })),
    ];

    // Merge regions
    const presentRegionSlugs = new Set(dbRegions.map((r) => r.slug));
    const mergedRegions = [
      ...dbRegions.map(({ id, name, slug, state }) => ({ id, name, slug, state })),
      ...REGIONS.filter((r) => !presentRegionSlugs.has(r.slug)).map(({ id, name, slug, state }) => ({ id, name, slug, state })),
    ];

    return (
      <ShopClient
        products={dbProducts.map(toProductItem)}
        categories={mergedCategories}
        collections={dbCollections.map(({ id, name, slug }) => ({ id, name, slug }))}
        regions={mergedRegions}
      />
    );
  } catch (error) {
    console.error("Product catalogue could not be loaded:", sanitizeDbError(error));
    return (
      <ShopClient
        products={[]}
        categories={CATEGORIES.map(({ id, name, slug }) => ({ id, name, slug }))}
        collections={[]}
        regions={REGIONS.map(({ id, name, slug, state }) => ({ id, name, slug, state }))}
        loadError
      />
    );
  }
}
