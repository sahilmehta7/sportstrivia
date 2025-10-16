import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth-helpers";

// GET /api/quizzes/[slug] - Get quiz by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { slug } = await params;

    // Find the quiz
    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            questionPool: true,
            attempts: true,
            reviews: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    // Check if quiz is published
    if (!quiz.isPublished || quiz.status !== "PUBLISHED") {
      throw new NotFoundError("Quiz not available");
    }

    // Check if quiz is currently available (time-based)
    const now = new Date();
    if (quiz.startTime && quiz.startTime > now) {
      return successResponse({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description,
          startTime: quiz.startTime,
        },
        available: false,
        message: "Quiz has not started yet",
      });
    }

    if (quiz.endTime && quiz.endTime < now) {
      return successResponse({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description,
          endTime: quiz.endTime,
        },
        available: false,
        message: "Quiz has ended",
      });
    }

    // Get user's attempts if logged in
    let userAttempts = null;
    if (user) {
      userAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: user.id,
          quizId: quiz.id,
          completedAt: { not: null },
        },
        orderBy: { score: "desc" },
        take: 5,
        select: {
          id: true,
          score: true,
          passed: true,
          completedAt: true,
          isPracticeMode: true,
        },
      });
    }

    // Get quiz leaderboard
    const leaderboard = await prisma.quizLeaderboard.findMany({
      where: { quizId: quiz.id },
      orderBy: { bestScore: "desc" },
      take: 10,
      select: {
        userId: true,
        bestScore: true,
        bestTime: true,
        rank: true,
      },
    });

    // Don't return questions in the initial response
    // Questions will be fetched when the quiz attempt starts
    const response = {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        slug: quiz.slug,
        description: quiz.description,
        descriptionImageUrl: quiz.descriptionImageUrl,
        descriptionVideoUrl: quiz.descriptionVideoUrl,
        sport: quiz.sport,
        difficulty: quiz.difficulty,
        duration: quiz.duration,
        timePerQuestion: quiz.timePerQuestion,
        passingScore: quiz.passingScore,
        questionCount: quiz._count.questionPool,
        questionSelectionMode: quiz.questionSelectionMode,
        showHints: quiz.showHints,
        negativeMarkingEnabled: quiz.negativeMarkingEnabled,
        penaltyPercentage: quiz.penaltyPercentage,
        timeBonusEnabled: quiz.timeBonusEnabled,
        averageRating: quiz.averageRating,
        totalReviews: quiz.totalReviews,
        totalAttempts: quiz._count.attempts,
        tags: quiz.tags.map((t) => t.tag),
        startTime: quiz.startTime,
        endTime: quiz.endTime,
      },
      available: true,
      userAttempts,
      leaderboard,
    };

    return successResponse(response);
  } catch (error) {
    return handleError(error);
  }
}

