import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Time period for leaderboards
 */
export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "all-time";

/**
 * Get date range for leaderboard period
 */
export function getDateRangeForPeriod(period: LeaderboardPeriod): Date | null {
  const now = new Date();

  switch (period) {
    case "daily":
      {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        return startOfDay;
      }

    case "weekly":
      {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
      }

    case "monthly":
      {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return startOfMonth;
      }

    case "all-time":
    default:
      return null;
  }
}

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry {
  userId: string;
  userName: string | null;
  userImage: string | null;
  score: number;
  totalPoints?: number;
  averageResponseTime?: number;
  rank: number;
  attempts?: number;
}

/**
 * Build global leaderboard based on quiz attempts
 */
export async function buildGlobalLeaderboard(
  period: LeaderboardPeriod,
  limit = 100
): Promise<LeaderboardEntry[]> {
  const MAX_LIMIT = 500;
  const safeLimit = Math.max(1, Math.min(limit, MAX_LIMIT));

  const startDate = getDateRangeForPeriod(period);

  const whereClause: Prisma.QuizAttemptWhereInput = {
    completedAt: { not: null },
    isPracticeMode: false,
  };

  if (startDate) {
    whereClause.completedAt = {
      gte: startDate,
      not: null,
    };
  }

  // Aggregate by user
  const results = await prisma.quizAttempt.groupBy({
    by: ["userId"],
    where: whereClause,
    _sum: { totalPoints: true, score: true },
    _avg: { averageResponseTime: true },
    _count: { id: true },
    orderBy: [
      { _sum: { totalPoints: "desc" } },
      { _avg: { averageResponseTime: "asc" } },
    ],
    take: safeLimit,
  });

  if (results.length === 0) {
    return [];
  }

  // Get user details
  const userIds = results.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return results.map((result, index) => {
    const user = userMap.get(result.userId);
    return {
      userId: result.userId,
      userName: user?.name || null,
      userImage: user?.image || null,
      score: result._sum.score || 0,
      totalPoints: result._sum.totalPoints || 0,
      averageResponseTime: result._avg.averageResponseTime || 0,
      attempts: result._count.id,
      rank: index + 1,
    };
  });
}

/**
 * Get user's position in global leaderboard
 */
export async function getUserGlobalPosition(
  userId: string,
  period: LeaderboardPeriod
): Promise<number | null> {
  const startDate = getDateRangeForPeriod(period);

  const rankQuery = Prisma.sql`
WITH leaderboard AS (
  SELECT
    "userId",
    SUM("totalPoints") AS points,
    AVG(COALESCE("averageResponseTime", 0)) AS avg_response
  FROM "QuizAttempt"
  WHERE "isPracticeMode" = false
    AND "completedAt" IS NOT NULL
    ${startDate ? Prisma.sql`AND "completedAt" >= ${startDate}` : Prisma.empty}
  GROUP BY "userId"
),
ranked AS (
  SELECT
    "userId",
    RANK() OVER (ORDER BY points DESC, avg_response ASC) AS rank
  FROM leaderboard
)
SELECT rank
FROM ranked
WHERE "userId" = ${userId}
`;

  const result = await prisma.$queryRaw<{ rank: bigint }[]>(rankQuery);

  if (result.length === 0) {
    return null;
  }

  return Number(result[0].rank);
}

/**
 * Build topic-specific leaderboard
 */
export async function buildTopicLeaderboard(
  topicId: string,
  period: LeaderboardPeriod,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  const startDate = getDateRangeForPeriod(period);

  // Get all questions for this topic
  const topicQuestions = await prisma.question.findMany({
    where: { topicId },
    select: { id: true },
  });

  const questionIds = topicQuestions.map((q) => q.id);

  if (questionIds.length === 0) {
    return [];
  }

  const whereClause: Prisma.UserAnswerWhereInput = {
    questionId: { in: questionIds },
    isCorrect: true,
  };

  if (startDate) {
    whereClause.createdAt = { gte: startDate };
  }

  // Aggregate correct answers by attempt first (UserAnswer has no direct userId)
  const byAttempt = await prisma.userAnswer.groupBy({
    by: ["attemptId"],
    where: whereClause,
    _count: { id: true },
  });

  if (byAttempt.length === 0) {
    return [];
  }

  const attemptIds = byAttempt.map((r) => r.attemptId);
  const attempts = await prisma.quizAttempt.findMany({
    where: { id: { in: attemptIds } },
    select: { id: true, userId: true },
  });
  const attemptToUser = new Map(attempts.map((a) => [a.id, a.userId]));

  // Reduce to per-user counts
  const userCounts = new Map<string, number>();
  for (const row of byAttempt) {
    const userId = attemptToUser.get(row.attemptId);
    if (!userId) continue;
    userCounts.set(userId, (userCounts.get(userId) || 0) + (row._count?.id || 0));
  }

  const sorted = Array.from(userCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) {
    return [];
  }

  const topUserIds = sorted.map(([userId]) => userId);
  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return sorted.map(([userId, count], index) => {
    const user = userMap.get(userId);
    return {
      userId,
      userName: user?.name || null,
      userImage: user?.image || null,
      score: count,
      rank: index + 1,
    };
  });
}
