import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const baseUrl = getSiteUrl();

const staticRoutes = [
  "",
  "/shop",
  "/collections/mens-ethnic-wear",
  "/about",
  "/contact",
  "/journal",
  "/faq",
  "/shipping-policy",
  "/return-policy",
  "/privacy-policy",
  "/terms",
].map((route) => ({
  url: `${baseUrl}${route}`,
  changeFrequency: (route === "" ? "daily" : route === "/shop" || route.startsWith("/collections") ? "daily" : "weekly") as "daily" | "weekly",
  priority: route === "" ? 1.0 : route === "/shop" ? 0.9 : route.startsWith("/collections") ? 0.85 : 0.7,
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [products, categories, regions] = await Promise.all([
      prisma.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
      prisma.region.findMany({ select: { slug: true } }),
    ]);

    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      ...categories.map((category) => ({
        url: `${baseUrl}/shop?category=${encodeURIComponent(category.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...regions.map((region) => ({
        url: `${baseUrl}/shop?region=${encodeURIComponent(region.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error("Sitemap catalog lookup failed:", error instanceof Error ? error.name : "unknown error");
    return staticRoutes;
  }
}
