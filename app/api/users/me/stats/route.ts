import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";

// GET /api/users/me/stats - Get current user's detailed statistics
export async function GET() {
  try {
    const user = await requireAuth();

    // Get quiz attempt stats
    const [attemptStats, passedCount, topTopics, recentAttempts, leaderboardPositions] =
      await Promise.all([
        prisma.quizAttempt.aggregate({
          where: {
            userId: user.id,
            completedAt: { not: null },
          },
          _avg: { score: true },
          _count: true,
        }),
        prisma.quizAttempt.count({
          where: {
            userId: user.id,
            passed: true,
          },
        }),
        // Top topics by success rate
        prisma.userTopicStats.findMany({
          where: { userId: user.id },
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
            userId: user.id,
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
        // Leaderboard positions
        prisma.quizLeaderboard.findMany({
          where: { userId: user.id },
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
        }),
      ]);

    // Get user data for streaks
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
      },
    });

    return successResponse({
      stats: {
        totalAttempts: attemptStats._count,
        averageScore: attemptStats._avg.score || 0,
        passedQuizzes: passedCount,
        passRate: attemptStats._count > 0 ? (passedCount / attemptStats._count) * 100 : 0,
        currentStreak: userData?.currentStreak || 0,
        longestStreak: userData?.longestStreak || 0,
      },
      topTopics,
      recentAttempts,
      leaderboardPositions,
    });
  } catch (error) {
    return handleError(error);
  }
}
