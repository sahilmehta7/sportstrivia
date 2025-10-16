import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";

// GET /api/users/[id]/stats - Get detailed user statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get quiz attempt stats
    const [attemptStats, passedCount, topTopics, recentAttempts] = await Promise.all([
      prisma.quizAttempt.aggregate({
        where: {
          userId: id,
          completedAt: { not: null },
        },
        _avg: { score: true },
        _count: true,
      }),
      prisma.quizAttempt.count({
        where: {
          userId: id,
          passed: true,
        },
      }),
      // Top topics by success rate
      prisma.userTopicStats.findMany({
        where: { userId: id },
        orderBy: { successRate: "desc" },
        take: 5,
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      // Recent quiz attempts
      prisma.quizAttempt.findMany({
        where: {
          userId: id,
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: 10,
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    // Get leaderboard positions
    const leaderboardPositions = await prisma.quizLeaderboard.findMany({
      where: { userId: id },
      orderBy: { rank: "asc" },
      take: 5,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return successResponse({
      user,
      stats: {
        totalAttempts: attemptStats._count,
        averageScore: attemptStats._avg.score || 0,
        passedQuizzes: passedCount,
        passRate: attemptStats._count > 0 ? (passedCount / attemptStats._count) * 100 : 0,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
      },
      topTopics,
      recentAttempts,
      leaderboardPositions,
    });
  } catch (error) {
    return handleError(error);
  }
}

