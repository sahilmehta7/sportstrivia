import { prisma } from "@/lib/db";
import { getUserBadgeProgress } from "@/lib/services/badge.service";
import type { UserRole } from "@prisma/client";

export interface UserProfileInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: UserRole;
  favoriteTeams: string[];
  totalPoints: number | null;
  experienceTier: string | null;
  currentStreak: number;
  longestStreak: number;
  createdAt: Date;
  lastActiveDate: Date | null;
}

export interface UserProfileStats {
  stats: {
    totalAttempts: number;
    averageScore: number;
    passedQuizzes: number;
    passRate: number;
    currentStreak: number;
    longestStreak: number;
  };
  topTopics: Array<{
    id: string;
    successRate: number;
    questionsAnswered: number;
    questionsCorrect: number;
    topic: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  recentAttempts: Array<{
    id: string;
    score: number | null;
    passed: boolean | null;
    completedAt: Date;
    quiz: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
  leaderboardPositions: Array<{
    id: string;
    rank: number;
    bestScore: number;
    bestTime: number | null;
    quiz: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
  perfectScores: number;
}

export async function getUserProfileInfo(userId: string): Promise<UserProfileInfo | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      role: true,
      favoriteTeams: true,
      totalPoints: true,
      experienceTier: true,
      currentStreak: true,
      longestStreak: true,
      createdAt: true,
      lastActiveDate: true,
    },
  });
}

export async function getUserProfileStats(userId: string): Promise<UserProfileStats> {
  const [
    attemptStats,
    passedCount,
    topTopics,
    recentAttempts,
    leaderboardPositions,
    userData,
    perfectScores,
  ] = await Promise.all([
    prisma.quizAttempt.aggregate({
      where: {
        userId,
        completedAt: { not: null },
      },
      _avg: { score: true },
      _count: true,
    }),
    prisma.quizAttempt.count({
      where: {
        userId,
        passed: true,
      },
    }),
    prisma.userTopicStats.findMany({
      where: { userId },
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
    prisma.quizAttempt.findMany({
      where: {
        userId,
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
    prisma.quizLeaderboard.findMany({
      where: { userId },
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
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
      },
    }),
    prisma.quizAttempt.count({
      where: {
        userId,
        score: 100,
        completedAt: { not: null },
      },
    }),
  ]);

  const totalAttempts = attemptStats._count;
  const averageScore = attemptStats._avg.score || 0;

  return {
    stats: {
      totalAttempts,
      averageScore,
      passedQuizzes: passedCount,
      passRate: totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0,
      currentStreak: userData?.currentStreak || 0,
      longestStreak: userData?.longestStreak || 0,
    },
    topTopics,
    recentAttempts,
    leaderboardPositions,
    perfectScores,
  };
}

export async function getUserBadgeProgressData(userId: string) {
  return getUserBadgeProgress(userId);
}

