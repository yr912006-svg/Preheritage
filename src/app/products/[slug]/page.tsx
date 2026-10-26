import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import ProductDetailClient from "./ProductDetailClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const record = await prisma.product.findFirst({ where: { slug: params.slug, status: "ACTIVE" }, include: catalogProductInclude });
  if (!record) notFound();
  const [related, reviews, user] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", id: { not: record.id }, OR: [
        { categoryId: record.categoryId }, ...(record.regionId ? [{ regionId: record.regionId }] : []),
      ] },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 4, include: catalogProductInclude,
    }),
    prisma.review.findMany({ where: { productId: record.id, status: "APPROVED" }, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
    getCustomerUser(),
  ]);
  return <ProductDetailClient product={toProductItem(record)} relatedProducts={related.map(toProductItem)} reviews={reviews.map((review) => ({
    id: review.id,
    author: review.user.name || "PREHERITAGE Patron",
    rating: review.rating,
    date: review.createdAt.toLocaleDateString("en-IN", { dateStyle: "long" }),
    verified: review.verifiedPurchase,
    title: review.title || "Verified Patron Review",
    comment: review.comment,
  }))} canReview={Boolean(user)} />;
}
