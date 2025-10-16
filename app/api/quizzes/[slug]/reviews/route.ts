import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import {
  type ReviewListFilters,
  buildReviewWhereClause,
  buildReviewOrderBy,
  reviewInclude,
} from "@/lib/dto/review-filters.dto";
import { calculatePagination, buildPaginationResult } from "@/lib/dto/quiz-filters.dto";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000).optional(),
});

// GET /api/quizzes/[slug]/reviews - Get quiz reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Find quiz by slug
    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    const filters: ReviewListFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      rating: searchParams.get("rating") ? parseInt(searchParams.get("rating")!) : undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const { skip, take } = calculatePagination(filters.page!, filters.limit!);
    const where = buildReviewWhereClause(quiz.id, filters);
    const orderBy = buildReviewOrderBy(filters.sortBy, filters.sortOrder);

    const [reviews, total] = await Promise.all([
      prisma.quizReview.findMany({
        where,
        skip,
        take,
        orderBy,
        include: reviewInclude,
      }),
      prisma.quizReview.count({ where }),
    ]);

    return successResponse({
      reviews,
      pagination: buildPaginationResult(filters.page!, filters.limit!, total),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/quizzes/[slug]/reviews - Submit quiz review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;
    const body = await request.json();
    const { rating, comment } = reviewSchema.parse(body);

    // Find quiz by slug
    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    // Check if user has completed this quiz
    const hasCompleted = await prisma.quizAttempt.findFirst({
      where: {
        userId: user.id,
        quizId: quiz.id,
        completedAt: { not: null },
      },
    });

    if (!hasCompleted) {
      throw new BadRequestError("You must complete the quiz before reviewing it");
    }

    // Check if user already reviewed this quiz
    const existingReview = await prisma.quizReview.findUnique({
      where: {
        userId_quizId: {
          userId: user.id,
          quizId: quiz.id,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestError("You have already reviewed this quiz. Use PATCH to update.");
    }

    // Create review
    const review = await prisma.quizReview.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        rating,
        comment,
      },
      include: reviewInclude,
    });

    // Update quiz average rating
    await updateQuizRating(quiz.id);

    return successResponse(
      { review, message: "Review submitted successfully" },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Helper function to update quiz average rating
 */
async function updateQuizRating(quizId: string): Promise<void> {
  const stats = await prisma.quizReview.aggregate({
    where: { quizId },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.quiz.update({
    where: { id: quizId },
    data: {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count,
    },
  });
}
