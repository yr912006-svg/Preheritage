import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";

export async function POST(request: Request, { params }: { params: { productId: string } }) {
  const user = await getCustomerUser();
  if (!user) return NextResponse.json({ message: "Sign in to submit a verified-purchase review." }, { status: 401 });
  try {
    const body = await request.json();
    const rating = Number(body?.rating);
    const comment = typeof body?.comment === "string" ? body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 8 || comment.length > 3000) {
      return NextResponse.json({ message: "Choose a rating and write a review between 8 and 3,000 characters." }, { status: 400 });
    }
    const product = await prisma.product.findFirst({ where: { id: params.productId, status: "ACTIVE" }, select: { id: true } });
    if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
    const purchase = await prisma.orderItem.findFirst({ where: { productId: product.id, order: { userId: user.id, status: "DELIVERED" } }, select: { id: true } });
    if (!purchase) return NextResponse.json({ message: "A delivered purchase of this piece is required before reviewing it." }, { status: 403 });
    const existing = await prisma.review.findFirst({ where: { productId: product.id, userId: user.id }, select: { id: true } });
    if (existing) return NextResponse.json({ message: "You have already reviewed this piece." }, { status: 409 });
    await prisma.review.create({ data: { productId: product.id, userId: user.id, rating, comment, verifiedPurchase: true, status: "PENDING" } });
    return NextResponse.json({ success: true, message: "Your review was submitted for moderation." }, { status: 201 });
  } catch (error) {
    console.error("Product review submission failed:", error);
    return NextResponse.json({ message: "We could not submit your review." }, { status: 503 });
  }
}
