import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";

// GET /api/users/[id] - Get public user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
        lastActiveDate: true,
        _count: {
          select: {
            quizAttempts: true,
            reviews: true,
            friends: true,
            badges: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get basic stats
    const stats = await prisma.quizAttempt.aggregate({
      where: {
        userId: id,
        completedAt: { not: null },
      },
      _avg: { score: true },
      _count: true,
    });

    const passedCount = await prisma.quizAttempt.count({
      where: {
        userId: id,
        passed: true,
      },
    });

    return successResponse({
      user,
      stats: {
        totalAttempts: stats._count,
        averageScore: stats._avg.score || 0,
        passedQuizzes: passedCount,
        passRate: stats._count > 0 ? (passedCount / stats._count) * 100 : 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

