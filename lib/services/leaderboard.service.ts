import { prisma } from "@/lib/db";

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
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay;
      
    case "weekly":
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;
      
    case "monthly":
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return startOfMonth;
      
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
  [key: string]: any;
}

/**
 * Build global leaderboard based on quiz attempts
 */
export async function buildGlobalLeaderboard(
  period: LeaderboardPeriod,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  const startDate = getDateRangeForPeriod(period);

  const whereClause: any = {
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
    take: limit,
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
  const leaderboard = await buildGlobalLeaderboard(period, 1000);
  const userEntry = leaderboard.find((entry) => entry.userId === userId);
  return userEntry?.rank || null;
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

  const whereClause: any = {
    questionId: { in: questionIds },
    isCorrect: true,
  };

  if (startDate) {
    whereClause.answeredAt = { gte: startDate };
  }

  // Aggregate correct answers by user
  const results = await prisma.userAnswer.groupBy({
    by: ["userId"],
    where: whereClause,
    _count: { id: true },
    orderBy: {
      _count: { id: "desc" },
    },
    take: limit,
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
      score: result._count.id, // Number of correct answers
      rank: index + 1,
    };
  });
}
