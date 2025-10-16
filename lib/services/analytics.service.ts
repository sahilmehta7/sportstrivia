import { prisma } from "@/lib/db";

export interface TopicInsight {
  topicId: string;
  topicName: string;
  topicSlug: string | null;
  questionsAnswered: number;
  questionsCorrect: number;
  successRate: number;
  averageTime: number;
}

export interface AttemptSummary {
  id: string;
  quizId: string;
  quizTitle: string;
  quizSlug: string;
  score: number;
  totalPoints: number;
  averageResponseTime: number;
  totalTimeSpent: number;
  passed: boolean;
  completedAt: Date;
}

export interface PerformanceAnalytics {
  overall: {
    totalAttempts: number;
    totalPoints: number;
    averageScore: number;
    bestScore: number;
    passRate: number;
    averageResponseTime: number;
    totalTimeSpent: number;
    currentStreak: number;
    longestStreak: number;
  };
  recentAttempts: AttemptSummary[];
  topics: {
    strengths: TopicInsight[];
    opportunities: TopicInsight[];
  };
  trends: {
    attempts: AttemptSummary[];
    averageScoreTrend: number[];
    averageTimeTrend: number[];
  };
  recommendations: {
    focusTopics: TopicInsight[];
    suggestedPractice: TopicInsight[];
  };
}

export async function buildPerformanceAnalytics(
  userId: string,
  options: {
    recentLimit?: number;
    trendLimit?: number;
    topicLimit?: number;
  } = {}
): Promise<PerformanceAnalytics> {
  const recentLimit = options.recentLimit ?? 8;
  const trendLimit = options.trendLimit ?? 12;
  const topicLimit = options.topicLimit ?? 5;

  const [user, attemptAggregate, passCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
      },
    }),
    prisma.quizAttempt.aggregate({
      where: { userId, completedAt: { not: null } },
      _count: true,
      _sum: { totalPoints: true, totalTimeSpent: true },
      _avg: { score: true, averageResponseTime: true },
      _max: { score: true },
    }),
    prisma.quizAttempt.count({
      where: { userId, passed: true, completedAt: { not: null } },
    }),
  ]);

  const totalAttempts = attemptAggregate._count;
  const totalPoints = attemptAggregate._sum.totalPoints ?? 0;
  const passRate =
    totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100 * 10) / 10 : 0;

  const recentAttemptsRaw = await prisma.quizAttempt.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: recentLimit,
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

  const trendAttemptsRaw = await prisma.quizAttempt.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: trendLimit,
    select: {
      id: true,
      score: true,
      averageResponseTime: true,
    },
  });

  const topicStats = await prisma.userTopicStats.findMany({
    where: { userId },
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  const topicInsights: TopicInsight[] = topicStats
    .map((stat) => ({
      topicId: stat.topicId,
      topicName: stat.topic?.name ?? "Unknown topic",
      topicSlug: stat.topic?.slug ?? null,
      questionsAnswered: stat.questionsAnswered,
      questionsCorrect: stat.questionsCorrect,
      successRate: stat.successRate,
      averageTime: stat.averageTime,
    }))
    .filter((insight) => insight.questionsAnswered > 0);

  const strengths = [...topicInsights]
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, topicLimit);

  const opportunities = [...topicInsights]
    .sort((a, b) => a.successRate - b.successRate || b.averageTime - a.averageTime)
    .slice(0, topicLimit);

  const focusTopics = opportunities.filter((topic) => topic.successRate < 70);
  const suggestedPractice = opportunities
    .filter((topic) => topic.averageTime > 15)
    .slice(0, 3);

  const recentAttempts: AttemptSummary[] = recentAttemptsRaw.map((attempt) => ({
    id: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quiz?.title ?? "Unknown quiz",
    quizSlug: attempt.quiz?.slug ?? "",
    score: attempt.score,
    totalPoints: attempt.totalPoints,
    averageResponseTime: attempt.averageResponseTime,
    totalTimeSpent: attempt.totalTimeSpent,
    passed: attempt.passed,
    completedAt: attempt.completedAt!,
  }));

  const orderedTrendAttempts = [...trendAttemptsRaw].reverse();

  return {
    overall: {
      totalAttempts,
      totalPoints,
      averageScore: attemptAggregate._avg.score ?? 0,
      bestScore: attemptAggregate._max.score ?? 0,
      passRate,
      averageResponseTime: attemptAggregate._avg.averageResponseTime ?? 0,
      totalTimeSpent: attemptAggregate._sum.totalTimeSpent ?? 0,
      currentStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
    },
    recentAttempts,
    topics: {
      strengths,
      opportunities,
    },
    trends: {
      attempts: recentAttempts,
      averageScoreTrend: orderedTrendAttempts.map((attempt) => attempt.score),
      averageTimeTrend: orderedTrendAttempts.map(
        (attempt) => attempt.averageResponseTime ?? 0
      ),
    },
    recommendations: {
      focusTopics,
      suggestedPractice,
    },
  };
}

