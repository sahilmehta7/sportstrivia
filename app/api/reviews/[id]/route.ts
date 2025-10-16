import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError } from "@/lib/errors";
import { z } from "zod";
import { reviewInclude } from "@/lib/dto/review-filters.dto";

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(1).max(1000).optional(),
});

// GET /api/reviews/[id] - Get review details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const review = await prisma.quizReview.findUnique({
      where: { id },
      include: reviewInclude,
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    return successResponse({ review });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/reviews/[id] - Update own review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    const review = await prisma.quizReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (review.userId !== user.id) {
      throw new ForbiddenError("You can only update your own reviews");
    }

    const updatedReview = await prisma.quizReview.update({
      where: { id },
      data: validatedData,
      include: reviewInclude,
    });

    // Update quiz average rating
    await updateQuizRating(review.quizId);

    return successResponse({
      review: updatedReview,
      message: "Review updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/reviews/[id] - Delete own review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const review = await prisma.quizReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (review.userId !== user.id) {
      throw new ForbiddenError("You can only delete your own reviews");
    }

    const quizId = review.quizId;

    await prisma.quizReview.delete({
      where: { id },
    });

    // Update quiz average rating
    await updateQuizRating(quizId);

    return successResponse({ message: "Review deleted successfully" });
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

