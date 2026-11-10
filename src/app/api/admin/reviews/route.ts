import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { adminAuditStore } from "@/lib/admin-audit";
import { ReviewStatus } from "@prisma/client";

export const runtime = "nodejs";

async function getReviewsAndQuestions(request: Request) {
  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status")?.toUpperCase();
    const query = url.searchParams.get("query")?.trim() || "";

    const reviewWhere: any = {};
    if (statusParam && ["PENDING", "APPROVED", "REJECTED"].includes(statusParam)) {
      reviewWhere.status = statusParam as ReviewStatus;
    }
    if (query) {
      reviewWhere.OR = [
        { comment: { contains: query, mode: "insensitive" } },
        { title: { contains: query, mode: "insensitive" } },
        { product: { title: { contains: query, mode: "insensitive" } } },
        { user: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    const [reviews, questions, pendingCount, totalReviews, totalQuestions] = await Promise.all([
      prisma.review.findMany({
        where: reviewWhere,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          product: {
            select: { id: true, title: true, slug: true, images: { take: 1, orderBy: { orderIndex: "asc" } } },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          images: true,
        },
      }),
      prisma.question.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          product: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.review.count(),
      prisma.question.count(),
    ]);

    return NextResponse.json({
      reviews,
      questions,
      counts: {
        pendingReviews: pendingCount,
        totalReviews,
        totalQuestions,
      },
    });
  } catch (error) {
    console.error("Admin reviews query failed:", error);
    return NextResponse.json({ message: "Could not load reviews." }, { status: 503 });
  }
}

async function updateReviewOrQuestion(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON request body." }, { status: 400 });
    }

    const { action } = body || {};

    if (action === "moderate-review") {
      const { reviewId, status, adminReply } = body;
      if (!reviewId || typeof reviewId !== "string") {
        return NextResponse.json({ message: "reviewId is required." }, { status: 400 });
      }

      const updateData: any = {};
      if (status) {
        if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
          return NextResponse.json({ message: "Invalid review status." }, { status: 400 });
        }
        updateData.status = status as ReviewStatus;
      }

      if (adminReply !== undefined) {
        updateData.adminReply = typeof adminReply === "string" ? adminReply.trim() || null : null;
      }

      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: updateData,
        select: { id: true, status: true, adminReply: true },
      });

      return NextResponse.json({ success: true, review: updated });
    }

    if (action === "answer-question") {
      const { questionId, answer, isPublic } = body;
      if (!questionId || typeof questionId !== "string") {
        return NextResponse.json({ message: "questionId is required." }, { status: 400 });
      }

      const updateData: any = {};
      if (answer !== undefined) {
        updateData.answer = typeof answer === "string" ? answer.trim() || null : null;
      }
      if (typeof isPublic === "boolean") {
        updateData.isPublic = isPublic;
      }

      const updated = await prisma.question.update({
        where: { id: questionId },
        data: updateData,
        select: { id: true, answer: true, isPublic: true },
      });

      return NextResponse.json({ success: true, question: updated });
    }

    return NextResponse.json({ message: "Unrecognized action." }, { status: 400 });
  } catch (error) {
    console.error("Admin review moderation failed:", error);
    return NextResponse.json({ message: "Could not update review or question." }, { status: 503 });
  }
}

function createAdminReviewsHandlers(authorize = requireAdminCapability) {
  return {
    GET: withAdminCapability(ADMIN_API_CAPABILITIES.reviews.methods.GET, getReviewsAndQuestions, authorize),
    PATCH: withAdminCapability(
      ADMIN_API_CAPABILITIES.reviews.methods.PATCH,
      updateReviewOrQuestion,
      authorize,
      adminAuditStore
    ),
  };
}

const handlers = createAdminReviewsHandlers();
export const { GET, PATCH } = handlers;
