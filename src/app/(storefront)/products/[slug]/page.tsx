import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import { SAMPLE_PRODUCTS, ProductItem } from "@/lib/sample-data";
import { isPrismaConnectionError, sanitizeDbError } from "@/lib/db-resilience";
import ProductDetailClient from "./ProductDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let title = "Luxury Indian Heritage Saree";
  let description = "Handcrafted Indian luxury textile from PREHERITAGE.";
  let image = "/images/og-share.jpg";

  try {
    const record = await prisma.product.findFirst({
      where: { slug, status: "ACTIVE" },
      select: { title: true, description: true, shortDesc: true, images: { select: { url: true } } },
    });
    if (record) {
      title = record.title;
      description = record.shortDesc || record.description.slice(0, 160);
      if (record.images && record.images.length > 0) image = record.images[0]?.url || "/images/og-share.jpg";
    } else {
      const sample = SAMPLE_PRODUCTS.find((p) => p.slug === slug);
      if (sample) {
        title = sample.title;
        description = sample.shortDesc || sample.description.slice(0, 160);
        if (sample.images && sample.images.length > 0) image = sample.images[0];
      }
    }
  } catch {
    const sample = SAMPLE_PRODUCTS.find((p) => p.slug === slug);
    if (sample) {
      title = sample.title;
      description = sample.shortDesc || sample.description.slice(0, 160);
      if (sample.images && sample.images.length > 0) image = sample.images[0];
    }
  }

  const canonicalUrl = `https://preheritage.com/products/${slug}`;
  const imageUrl = image.startsWith("http") ? image : `https://preheritage.com${image}`;

  return {
    title: `${title} | PREHERITAGE`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | PREHERITAGE`,
      description,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PREHERITAGE`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let record = null;
  let dbError = false;

  // Attempt database retrieval with resilient error handling
  try {
    record = await prisma.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: catalogProductInclude,
    });
  } catch (error) {
    dbError = true;
    console.error(`Database lookup error for product slug "${slug}":`, sanitizeDbError(error));
    // If it's a connection pool timeout or connection reset, try one quick reconnection
    if (isPrismaConnectionError(error)) {
      try {
        await prisma.$disconnect().catch(() => {});
        record = await prisma.product.findFirst({
          where: { slug, status: "ACTIVE" },
          include: catalogProductInclude,
        });
        dbError = false;
      } catch (retryError) {
        console.error(`Database retry failed for slug "${slug}":`, sanitizeDbError(retryError));
      }
    }
  }

  // If found in active database catalog
  if (record) {
    const product = toProductItem(record);
    let related: ProductItem[] = [];
    let reviews: {
      id: string;
      author: string;
      rating: number;
      date: string;
      verified: boolean;
      title: string;
      comment: string;
    }[] = [];
    let user = null;

    try {
      const [dbRelated, dbReviews, authUser] = await Promise.all([
        prisma.product.findMany({
          where: {
            status: "ACTIVE",
            id: { not: record.id },
            OR: [
              { categoryId: record.categoryId },
              ...(record.regionId ? [{ regionId: record.regionId }] : []),
            ],
          },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: 4,
          include: catalogProductInclude,
        }),
        prisma.review.findMany({
          where: { productId: record.id, status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        }),
        getCustomerUser().catch(() => null),
      ]);

      related = dbRelated.map(toProductItem);
      reviews = dbReviews.map((review) => ({
        id: review.id,
        author: review.user.name || "PREHERITAGE Patron",
        rating: review.rating,
        date: review.createdAt.toLocaleDateString("en-IN", { dateStyle: "long" }),
        verified: review.verifiedPurchase,
        title: review.title || "Verified Patron Review",
        comment: review.comment,
      }));
      user = authUser;
    } catch (auxError) {
      console.error("Auxiliary product data load error:", sanitizeDbError(auxError));
    }

    // If related database items are fewer than 4, supplement with curated regional/craft pieces
    if (related.length < 4) {
      const matchingSamples = SAMPLE_PRODUCTS.filter(
        (sp) =>
          sp.slug !== product.slug &&
          (sp.category === product.category || sp.region === product.region)
      );
      const remainingSlots = 4 - related.length;
      const additionalSamples = (
        matchingSamples.length > 0 ? matchingSamples : SAMPLE_PRODUCTS.filter((sp) => sp.slug !== product.slug)
      ).slice(0, remainingSlots);

      related = [...related, ...additionalSamples];
    }

    const productJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description || product.shortDesc,
      image: product.images.map((img) => (img.startsWith("http") ? img : `https://preheritage.com${img}`)),
      sku: product.id,
      brand: {
        "@type": "Brand",
        name: "PREHERITAGE",
      },
      offers: {
        "@type": "Offer",
        url: `https://preheritage.com/products/${product.slug}`,
        priceCurrency: "INR",
        price: product.price,
        availability:
          product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: "PREHERITAGE",
        },
      },
      ...(reviews.length > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1),
              reviewCount: reviews.length,
            },
            review: reviews.map((r) => ({
              "@type": "Review",
              author: { "@type": "Person", name: r.author },
              reviewRating: { "@type": "Rating", ratingValue: r.rating },
              reviewBody: r.comment,
            })),
          }
        : {}),
    };

    const breadcrumbJsonLd = {
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
        ...(product.category
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: product.category,
                item: `https://preheritage.com/shop?category=${encodeURIComponent(product.category.toLowerCase().replace(/\s+/g, "-"))}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: product.category ? 4 : 3,
          name: product.title,
          item: `https://preheritage.com/products/${product.slug}`,
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <ProductDetailClient
          product={product}
          relatedProducts={related}
          reviews={reviews}
          canReview={Boolean(user)}
        />
      </>
    );
  }

  // Fallback to authentic curated catalog item if present in master catalog
  const sampleProduct = SAMPLE_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
  if (sampleProduct) {
    const relatedSamples = SAMPLE_PRODUCTS.filter(
      (p) => p.slug !== sampleProduct.slug && (p.category === sampleProduct.category || p.region === sampleProduct.region)
    ).slice(0, 4);

    const finalRelated =
      relatedSamples.length >= 2
        ? relatedSamples
        : SAMPLE_PRODUCTS.filter((p) => p.slug !== sampleProduct.slug).slice(0, 4);

    const sampleProductJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: sampleProduct.title,
      description: sampleProduct.description || sampleProduct.shortDesc,
      image: sampleProduct.images.map((img) => (img.startsWith("http") ? img : `https://preheritage.com${img}`)),
      sku: sampleProduct.id,
      brand: {
        "@type": "Brand",
        name: "PREHERITAGE",
      },
      offers: {
        "@type": "Offer",
        url: `https://preheritage.com/products/${sampleProduct.slug}`,
        priceCurrency: "INR",
        price: sampleProduct.price,
        availability:
          sampleProduct.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: "PREHERITAGE",
        },
      },
    };

    const sampleBreadcrumbJsonLd = {
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
        ...(sampleProduct.category
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: sampleProduct.category,
                item: `https://preheritage.com/shop?category=${encodeURIComponent(sampleProduct.category.toLowerCase().replace(/\s+/g, "-"))}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: sampleProduct.category ? 4 : 3,
          name: sampleProduct.title,
          item: `https://preheritage.com/products/${sampleProduct.slug}`,
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sampleProductJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sampleBreadcrumbJsonLd) }}
        />
        <ProductDetailClient
          product={sampleProduct}
          relatedProducts={finalRelated}
          reviews={[]}
          canReview={false}
        />
      </>
    );
  }

  // If not found in either database or curated catalog
  notFound();
}
