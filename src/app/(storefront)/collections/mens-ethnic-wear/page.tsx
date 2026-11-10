import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Sparkles, Clock, Compass, ShieldCheck, Mail } from "lucide-react";
import prisma from "@/lib/prisma";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import ProductCard from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Men’s Ethnic Wear — Heritage, Worn Your Way | PREHERITAGE",
  description:
    "Discover kurtas and Nehru jackets with clean silhouettes, considered details, and a heritage-inspired point of view.",
  openGraph: {
    title: "Men’s Ethnic Wear — Heritage, Worn Your Way | PREHERITAGE",
    description:
      "Discover kurtas and Nehru jackets with clean silhouettes, considered details, and a heritage-inspired point of view.",
    url: "https://preheritage.com/collections/mens-ethnic-wear",
    images: [{ url: "/images/campaign/imperial-menswear-ivory.jpg", width: 896, height: 1200 }],
  },
  alternates: {
    canonical: "https://preheritage.com/collections/mens-ethnic-wear",
  },
};

export default async function MensEthnicWearCollectionPage() {
  let products = [];

  try {
    const records = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { collection: { slug: "mens-ethnic-wear" } },
          { category: { slug: "mens-ethnic-wear" } },
        ],
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: catalogProductInclude,
    });
    products = records.map(toProductItem);
  } catch (error) {
    console.error("Men's Ethnic Wear products could not be loaded:", error);
  }

  return (
    <main className="min-h-screen bg-ivory-100 text-charcoal-900">
      {/* Structured Data: Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://preheritage.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Collections",
                item: "https://preheritage.com/shop",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Men’s Ethnic Wear",
                item: "https://preheritage.com/collections/mens-ethnic-wear",
              },
            ],
          }),
        }}
      />
      {/* Breadcrumb Navigation */}
      <div className="border-b border-ivory-300 bg-ivory-50/70 py-3.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-charcoal-400">
            <Link href="/" className="transition-colors hover:text-gold-700">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/shop" className="transition-colors hover:text-gold-700">
              Collections
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-charcoal-900" aria-current="page">
              Men’s Ethnic Wear
            </span>
          </nav>
        </div>
      </div>

      {/* Collection Hero Header */}
      <section className="relative border-b border-ivory-300 bg-ivory-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-700 sm:text-xs">
                Private Atelier Capsule · Men’s Ethnic Wear
              </span>
              <h1 className="font-serif text-4xl font-normal leading-[1.05] tracking-tight text-charcoal-900 sm:text-5xl lg:text-6xl">
                Heritage, Worn Your Way
              </h1>
              <p className="mt-5 max-w-2xl font-serif text-lg italic leading-relaxed text-charcoal-600 sm:text-xl">
                “Discover kurtas and Nehru jackets with clean silhouettes, considered details, and a heritage-inspired point of view.”
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-charcoal-500 sm:text-base">
                Tailored for modern poise and rooted in generations of Indian textile excellence. Each piece blends breathable handspun cottons and raw silks with refined architectural lines.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xs bg-charcoal-900 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-ivory-50 transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <span>Atelier Concierge Inquiries</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xs border border-ivory-400 bg-ivory-100 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-900 transition-colors hover:border-gold-500 hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Browse All Active Pieces</span>
                </Link>
              </div>
            </div>

            {/* Campaign Visual Feature */}
            <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-sm border border-ivory-300 shadow-sm lg:col-span-5 lg:mx-auto">
              <Image
                src="/images/campaign/imperial-menswear-ivory.jpg"
                alt="Imperial Men’s Ethnic Wear campaign — Indian male model in bespoke ivory silk kurta and textured burgundy bandi waistcoat"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-ivory-50">
                <span className="text-[10px] uppercase tracking-widest text-gold-300 font-medium block">
                  Campaign Visual
                </span>
                <p className="font-serif text-lg text-white mt-1">
                  The Inaugural Menswear Capsule
                </p>
                <p className="text-xs text-ivory-300 font-light mt-0.5">
                  Varanasi &amp; Chanderi Artisan Guilds
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {products.length > 0 ? (
            <div>
              <div className="mb-10 flex items-center justify-between border-b border-ivory-300 pb-4">
                <h2 className="font-serif text-2xl font-bold text-charcoal-900">
                  Available Pieces ({products.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : (
            /* Graceful Empty State with Forthcoming Pieces Preview */
            <div className="space-y-16">
              {/* Forthcoming Releases Header */}
              <div className="text-center max-w-2xl mx-auto">
                <span className="text-[10px] uppercase tracking-[0.26em] text-gold-700 font-semibold font-sans block mb-2">
                  Atelier Intake in Progress
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
                  Inaugural Menswear Editions
                </h2>
                <p className="mt-3 text-sm text-charcoal-500 leading-relaxed">
                  These bespoke menswear creations are currently undergoing master tailoring and authentication at our partner looms. Publication details and release orders will open shortly.
                </p>
              </div>

              {/* Forthcoming Products Showcase (Non-purchasable Preview Cards) */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                {/* 1. Aangan Cotton Kurta */}
                <div className="relative flex flex-col justify-between rounded-sm border border-ivory-300 bg-ivory-50 p-7 sm:p-9 shadow-sm transition-all hover:border-gold-400">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory-200/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-charcoal-700">
                        <Clock className="h-3 w-3 text-gold-600" />
                        In Master Tailoring
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-400">
                        Edition 01
                      </span>
                    </div>

                    <h3 className="mt-5 font-serif text-2xl sm:text-3xl font-normal text-charcoal-900">
                      Aangan Cotton Kurta
                    </h3>

                    <p className="mt-3 text-xs leading-relaxed text-charcoal-500 sm:text-sm">
                      Clean silhouettes crafted from breathable handspun khadi cotton, tailored with a subtle mandarin collar and mother-of-pearl buttons. Designed for understated elegance and enduring comfort.
                    </p>

                    <div className="mt-6 space-y-2 border-t border-ivory-200 pt-5 text-xs text-charcoal-600">
                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400 font-sans">Craft Form</span>
                        <span className="font-medium text-charcoal-900">Handspun Khadi Cotton</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400 font-sans">Silhouette</span>
                        <span className="font-medium text-charcoal-900">Straight Cut · Mandarin Collar</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400 font-sans">Status</span>
                        <span className="text-gold-700 font-medium">Awaiting Atelier Intake</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-ivory-200 pt-5">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-900 hover:text-gold-700 transition-colors"
                    >
                      <span>Inquire About Sizing &amp; Release</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* 2. Rekha Heritage Bandi */}
                <div className="relative flex flex-col justify-between rounded-sm border border-ivory-300 bg-ivory-50 p-7 sm:p-9 shadow-sm transition-all hover:border-gold-400">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory-200/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-charcoal-700">
                        <Sparkles className="h-3 w-3 text-gold-600" />
                        Weave Lineage Intake
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-400">
                        Edition 02
                      </span>
                    </div>

                    <h3 className="mt-5 font-serif text-2xl sm:text-3xl font-normal text-charcoal-900">
                      Rekha Heritage Bandi
                    </h3>

                    <p className="mt-3 text-xs leading-relaxed text-charcoal-500 sm:text-sm">
                      A refined Nehru jacket structured with rich textured handloom fabric in a muted maroon tone, finished with bespoke antique brass buttons and clean welt pocket detailing.
                    </p>

                    <div className="mt-6 space-y-2 border-t border-ivory-200 pt-5 text-xs text-charcoal-600">
                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400 font-sans">Craft Form</span>
                        <span className="font-medium text-charcoal-900">Textured Handloom Silk-Cotton</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400 font-sans">Hardware</span>
                        <span className="font-medium text-charcoal-900">Antique Brass Buttons</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400 font-sans">Status</span>
                        <span className="text-gold-700 font-medium">Awaiting Atelier Intake</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-ivory-200 pt-5">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-900 hover:text-gold-700 transition-colors"
                    >
                      <span>Inquire About Sizing &amp; Release</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Atelier Notification & Lineage Banner */}
              <div className="mx-auto max-w-4xl rounded-sm border border-gold-200 bg-ivory-50/80 p-8 sm:p-10">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-gold-600" />
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-charcoal-900">Pure Craft Lineage</h4>
                      <p className="mt-1 text-xs text-charcoal-500">Every piece certified for genuine artisan handloom provenance.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Compass className="h-5 w-5 shrink-0 text-gold-600" />
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-charcoal-900">Bespoke Fit Consulting</h4>
                      <p className="mt-1 text-xs text-charcoal-500">Private appointments available for custom trousseau sizing.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-gold-600" />
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-charcoal-900">Patron Early Access</h4>
                      <p className="mt-1 text-xs text-charcoal-500">Subscribers receive advance notifications before general release.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
