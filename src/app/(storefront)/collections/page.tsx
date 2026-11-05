import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, Sparkles, ShieldCheck } from "lucide-react";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import ProductCard from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Curated Heritage Collections — Master Weaves & Capsules | PREHERITAGE",
  description:
    "Explore curated collections from PREHERITAGE: Men’s Ethnic Wear, Varanasi Katan Silk Sarees, Kashmir Pashmina Shawls, Gota Patti Lehengas, and GI-certified master handlooms.",
  openGraph: {
    title: "Curated Heritage Collections | PREHERITAGE",
    description:
      "Explore curated collections from PREHERITAGE: Men’s Ethnic Wear, Varanasi Katan Silk Sarees, Kashmir Pashmina Shawls, and master handlooms.",
    url: "https://preheritage.com/collections",
    images: [{ url: "/images/campaign/couture-saree-mineral.jpg", width: 1200, height: 800 }],
  },
  alternates: {
    canonical: "https://preheritage.com/collections",
  },
};

const CURATED_COLLECTIONS = [
  {
    slug: "mens-ethnic-wear",
    href: "/collections/mens-ethnic-wear",
    title: "Heritage, Worn Your Way",
    subtitle: "Men’s Ethnic Wear · Private Atelier Capsule",
    description:
      "Classic kurtas and refined Nehru jackets with clean silhouettes, considered details, and a heritage-inspired point of view.",
    image: "/images/campaign/imperial-menswear-ivory.jpg",
    craft: "Chanderi Silk & Zardozi",
    categorySlug: "mens-ethnic-wear",
  },
  {
    slug: "sarees",
    href: "/shop?category=sarees",
    title: "Six Yards of Unstitched Poetry",
    subtitle: "Sacred Looms of India · Sarees",
    description:
      "Handwoven pure Katan, Kadwa, and Jamdani silks woven across the sacred pit looms of Varanasi, Bengal, and Kanchipuram.",
    image: "/images/campaign/couture-saree-mineral.jpg",
    craft: "Kashi Katan Silk & Antique Zari",
    categorySlug: "sarees",
  },
  {
    slug: "accessories",
    href: "/shop?category=accessories",
    title: "High-Altitude Pashmina & Heirlooms",
    subtitle: "Himalayan Whisper · Accessories & Shawls",
    description:
      "Pure Changthangi Pashmina wraps, Sozni needlework, and handcrafted antique gold accents from high-altitude artisan lineages.",
    image: "/images/categories/category-accessories.jpg",
    craft: "Changthangi Cashmere & Sozni Stitches",
    categorySlug: "accessories",
  },
  {
    slug: "lehengas",
    href: "/shop?category=lehengas",
    title: "Regal Silhouettes & Gota Patti",
    subtitle: "Marwar & Rajputana Splendor · Lehengas",
    description:
      "Flowing raw silk ensembles adorned with genuine metal ribbon appliqué, zardozi, and hand-embroidery.",
    image: "/images/campaign/occasion-burgundy-gala.jpg",
    craft: "Gota Patti & Royal Bandhej",
    categorySlug: "lehengas",
  },
  {
    slug: "kurtas",
    href: "/shop?category=kurtas",
    title: "Modern Poise, Ancient Weaves",
    subtitle: "Awadh & Chanderi Tailoring · Kurtas & Tunics",
    description:
      "Breathable silks, handspun khadi, and delicate zardozi detailing tailored for timeless grace.",
    image: "/images/categories/category-kurtas.jpg",
    craft: "Chanderi Handloom & Fine Needlecraft",
    categorySlug: "kurtas",
  },
  {
    slug: "handloom",
    href: "/shop?category=handloom",
    title: "Living Traditions of the Loom",
    subtitle: "GI-Tagged Master Clusters · Pure Handloom",
    description:
      "Pure GI-tagged heritage weaves from master artisan clusters preserving ancestral handcrafting techniques.",
    image: "/images/campaign/macro-silk-zari.jpg",
    craft: "GI-Certified Ancestral Weaves",
    categorySlug: "handloom",
  },
];

export default async function CollectionsPage() {
  let activeProducts: ReturnType<typeof toProductItem>[] = [];

  try {
    const records = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: catalogProductInclude,
    });
    activeProducts = records.map(toProductItem);
  } catch (error) {
    console.error("Collections showcase could not be loaded:", error);
  }

  return (
    <main className="min-h-screen bg-ivory-100 text-charcoal-900 pb-20">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-ivory-300 bg-ivory-50/70 py-3.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-charcoal-400">
            <Link href="/" className="transition-colors hover:text-gold-700">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-charcoal-900" aria-current="page">
              Collections
            </span>
          </nav>
        </div>
      </div>

      {/* Editorial Header */}
      <header className="border-b border-ivory-300 bg-ivory-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold-700">
              <Sparkles className="h-4 w-4" />
              <span>Curated Haute Lineages</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-charcoal-950">
              The Heritage Collections
            </h1>
            <p className="text-sm sm:text-base text-charcoal-600 font-light leading-relaxed">
              Every PREHERITAGE capsule is curated in dialogue with India’s foremost master weaver guilds.
              Explore our distinctive chapters—from imperial Awadh tailoring to sacred Katan silks and
              high-altitude Himalayan pashmina.
            </p>
          </div>
        </div>
      </header>

      {/* Curated Collection Cards Grid */}
      <section aria-label="Curated Collections" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {CURATED_COLLECTIONS.map((col) => (
            <article
              key={col.slug}
              className="group flex flex-col overflow-hidden rounded-sm border border-ivory-300 bg-white transition-all duration-300 hover:border-gold-500 hover:shadow-luxury"
            >
              {/* Image Frame */}
              <Link href={col.href} className="relative aspect-[4/5] w-full overflow-hidden bg-stone-100">
                <Image
                  src={col.image}
                  alt={col.title}
                  fill
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-ivory-100">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-300">
                    {col.craft}
                  </span>
                  <h3 className="font-serif text-2xl font-light leading-tight text-white mt-1">
                    {col.title}
                  </h3>
                </div>
              </Link>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-6">
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-700">
                    {col.subtitle}
                  </span>
                  <p className="text-xs text-charcoal-600 font-light leading-relaxed">
                    {col.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-ivory-200">
                  <Link
                    href={col.href}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-900 group-hover:text-gold-700 transition-colors"
                  >
                    <span>Explore Capsule</span>
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Featured Pieces from Active Database */}
      {activeProducts.length > 0 && (
        <section aria-label="Featured Collection Heirlooms" className="border-t border-ivory-300 bg-ivory-50/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">
                  Vault Showcase
                </span>
                <h2 className="font-serif text-3xl font-light text-charcoal-950 mt-1">
                  Heirlooms in Current Curation
                </h2>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-800 hover:text-gold-700 transition-colors"
              >
                <span>View Complete Catalogue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {activeProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Heritage Assurance Banner */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded bg-white p-8 border border-ivory-300">
          <div className="flex items-start gap-4">
            <ShieldCheck className="h-6 w-6 text-gold-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif text-base font-semibold text-charcoal-900">
                100% Authentic Handloom Certification
              </h4>
              <p className="text-xs text-charcoal-500 mt-1 font-light leading-relaxed">
                Every creation comes with Silk Mark or craft provenance documentation ensuring unadulterated purity.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Compass className="h-6 w-6 text-gold-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif text-base font-semibold text-charcoal-900">
                Direct Master Weaver Lineages
              </h4>
              <p className="text-xs text-charcoal-500 mt-1 font-light leading-relaxed">
                Fair trade preservation directly empowering ancestral craft families across Varanasi, Kashmir, and Rajasthan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-gold-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif text-base font-semibold text-charcoal-900">
                Private Salon Concierge
              </h4>
              <p className="text-xs text-charcoal-500 mt-1 font-light leading-relaxed">
                Complimentary textile consultation and personalized draping guidance for our private patrons.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
