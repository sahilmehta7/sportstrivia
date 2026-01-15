import { Difficulty, Prisma, SearchContext } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  buildPaginationResult,
  buildPublicQuizWhereClause,
  buildQuizOrderBy,
  calculatePagination,
  type PaginationResult,
  type PublicQuizFilters,
} from "@/lib/dto/quiz-filters.dto";
import { getTopicIdsWithDescendants } from "@/lib/services/topic.service";
import { recordSearchQuery } from "@/lib/services/search-query.service";

export const publicQuizCardSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  descriptionImageUrl: true,
  sport: true,
  difficulty: true,
  duration: true,
  passingScore: true,
  averageRating: true,
  totalReviews: true,
  isFeatured: true,
  startTime: true,
  endTime: true,
  createdAt: true,
  maxAttemptsPerUser: true,
  attemptResetPeriod: true,
  _count: {
    select: {
      questionPool: true,
      attempts: true,
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.QuizSelect;

export type PublicQuizListItem = Prisma.QuizGetPayload<{
  select: typeof publicQuizCardSelect;
}>;

export interface PublicQuizListResponse {
  quizzes: PublicQuizListItem[];
  pagination: PaginationResult;
  filters: {
    sport?: string;
    difficulty?: Difficulty;
    tag?: string;
    topic?: string;
    isFeatured?: boolean;
    comingSoon?: boolean;
    minDuration: number | null;
    maxDuration: number | null;
    minRating?: number;
    sortBy?: "popularity" | "rating" | "createdAt";
    sortOrder?: "asc" | "desc";
  };
}

interface PublicQuizListOptions {
  telemetryUserId?: string;
  telemetryEnabled?: boolean;
}

export async function getPublicQuizList(
  input: PublicQuizFilters,
  options: PublicQuizListOptions = {}
): Promise<PublicQuizListResponse> {
  const page = input.page && input.page > 0 ? input.page : 1;
  const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 50) : 12;

  const filters: PublicQuizFilters = {
    ...input,
    page,
    limit,
  };
  const { telemetryUserId, telemetryEnabled = true } = options;

  if (filters.topic) {
    const topic = await prisma.topic.findUnique({
      where: { slug: filters.topic },
      select: { id: true },
    });

    if (topic) {
      const topicIds = await getTopicIdsWithDescendants(topic.id);
      filters.topicIds = topicIds;
    }
  }

  const { skip, take } = calculatePagination(page, limit);
  const where = buildPublicQuizWhereClause(filters);
  const orderBy = buildQuizOrderBy(filters.sortBy, filters.sortOrder);

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take,
      orderBy,
      select: publicQuizCardSelect,
    }),
    prisma.quiz.count({ where }),
  ]);

  if (filters.search && telemetryEnabled) {
    await recordSearchQuery({
      query: filters.search,
      context: SearchContext.QUIZ,
      resultCount: total,
      userId: telemetryUserId,
    });
  }

  return {
    quizzes,
    pagination: buildPaginationResult(page, limit, total),
    filters: {
      sport: filters.sport,
      difficulty: filters.difficulty,
      tag: filters.tag,
      topic: filters.topic,
      isFeatured: filters.isFeatured,
      comingSoon: filters.comingSoon,
      minDuration: filters.minDuration ? filters.minDuration / 60 : null,
      maxDuration: filters.maxDuration ? filters.maxDuration / 60 : null,
      minRating: filters.minRating,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
  };
}

export interface QuizFilterOptions {
  sports: string[];
  difficulties: Difficulty[];
  tags: { name: string; slug: string }[];
  topics: { name: string; slug: string }[];
}

export async function getPublicQuizFilterOptions(): Promise<QuizFilterOptions> {
  const [sports, tags, topics] = await Promise.all([
    prisma.quiz.findMany({
      where: {
        isPublished: true,
        status: "PUBLISHED",
        sport: { not: null },
      },
      distinct: ["sport"],
      select: { sport: true },
      orderBy: { sport: "asc" },
    }),
    prisma.quizTag.findMany({
      where: {
        quizzes: {
          some: {
            quiz: {
              isPublished: true,
              status: "PUBLISHED",
            },
          },
        },
      },
      select: {
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.topic.findMany({
      where: {
        OR: [
          {
            quizTopicConfigs: {
              some: {
                quiz: {
                  isPublished: true,
                  status: "PUBLISHED",
                },
              },
            },
          },
          {
            questions: {
              some: {
                quizPools: {
                  some: {
                    quiz: {
                      isPublished: true,
                      status: "PUBLISHED",
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return {
    sports: sports
      .map((item) => item.sport)
      .filter((sport): sport is string => Boolean(sport)),
    difficulties: Object.values(Difficulty),
    tags,
    topics,
  };
}

export interface DailyQuizItem {
  id: string;
  slug: string;
  title: string;
  sport: string | null;
  difficulty: Difficulty;
  duration: number | null;
  descriptionImageUrl: string | null;
  description: string | null;
  completedToday: boolean;
  streakCount: number;
  userRank?: number;
}

/**
 * Fetches daily recurring quizzes and enriches them with user completion data
 * @param userId - Optional user ID to check completion status and streaks
 */
export interface ComingSoonQuiz {
  title: string;
  sport: string;
  difficulty: Difficulty;
  estimatedDate: string;
  description?: string;
}

/**
 * Fetches upcoming quizzes (published but with future start time)
 */
export async function getComingSoonQuizzes(limit: number = 6): Promise<ComingSoonQuiz[]> {
  const now = new Date();

  const quizzes = await prisma.quiz.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
      startTime: {
        gt: now, // Start time in the future
      },
    },
    select: {
      title: true,
      sport: true,
      difficulty: true,
      startTime: true,
      description: true,
    },
    orderBy: {
      startTime: "asc", // Soonest first
    },
    take: limit,
  });

  return quizzes.map(quiz => ({
    title: quiz.title,
    sport: quiz.sport || "Multi-sport",
    difficulty: quiz.difficulty,
    estimatedDate: quiz.startTime
      ? new Date(quiz.startTime).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "TBA",
    description: quiz.description || undefined,
  }));
}

export async function getDailyRecurringQuizzes(
  userId?: string
): Promise<DailyQuizItem[]> {
  // Fetch daily recurring quizzes
  const dailyQuizzes = await prisma.quiz.findMany({
    where: {
      // Backward compatibility: include quizzes that are marked daily either via
      // the new recurringType or the older attemptResetPeriod flag
      OR: [
        { recurringType: "DAILY" },
        { attemptResetPeriod: "DAILY" },
      ],
      isPublished: true,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      sport: true,
      difficulty: true,
      duration: true,
      descriptionImageUrl: true,
      description: true,
    },
    orderBy: {
      isFeatured: "desc", // Featured quizzes first
    },
    take: 12, // Increased limit for daily quizzes
  });

  if (!userId) {
    // Return without user-specific data
    return dailyQuizzes.map((quiz) => ({
      ...quiz,
      completedToday: false,
      streakCount: 0,
    }));
  }

  // Get today's date range (start and end of day in user's timezone)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch user's attempts for these quizzes
  const quizIds = dailyQuizzes.map((q) => q.id);

  // Get last 30 days for streak calculations
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [todayAttempts, allStreakAttempts, userRanks] = await Promise.all([
    // Check if user completed any of these quizzes today
    prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId: { in: quizIds },
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        quizId: true,
      },
    }),
    // Fetch all attempts for all quizIds in a single query (fixes N+1)
    prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId: { in: quizIds },
        completedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        quizId: true,
        completedAt: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    }),
    // Get user ranks for these quizzes
    prisma.quizLeaderboard.findMany({
      where: {
        userId,
        quizId: { in: quizIds },
      },
      select: {
        quizId: true,
        rank: true,
      },
    }),
  ]);

  // Calculate streaks in-memory (grouped by quizId)
  const attemptsByQuiz = new Map<string, Date[]>();
  for (const attempt of allStreakAttempts) {
    if (!attempt.completedAt) continue;
    const dates = attemptsByQuiz.get(attempt.quizId) || [];
    dates.push(attempt.completedAt);
    attemptsByQuiz.set(attempt.quizId, dates);
  }

  const todayTime = today.getTime();
  const yesterdayTime = todayTime - 86400000; // 24 hours in ms
  const streakMap = new Map<string, number>();

  // Calculate streak for each quiz
  for (const quizId of quizIds) {
    const attempts = attemptsByQuiz.get(quizId) || [];

    // Convert to unique dates (same day = one entry)
    const attemptDates = attempts
      .map((date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      });
    const uniqueDates = [...new Set(attemptDates)].sort((a, b) => b - a);

    // Calculate consecutive days streak
    let streak = 0;

    if (uniqueDates.length === 0) {
      streakMap.set(quizId, 0);
      continue;
    }

    // Check if the most recent activity was today or yesterday
    const mostRecentDate = uniqueDates[0];

    // Only count streak if activity was today or yesterday
    // (if last activity was 2+ days ago, streak is broken)
    if (mostRecentDate !== todayTime && mostRecentDate !== yesterdayTime) {
      streakMap.set(quizId, 0);
      continue;
    }

    // Start counting from the most recent date
    streak = 1;
    let expectedNextDate = mostRecentDate - 86400000; // Previous day

    // Count backwards through consecutive days
    for (let i = 1; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === expectedNextDate) {
        streak++;
        expectedNextDate -= 86400000;
      } else {
        // Gap in dates - streak is broken
        break;
      }
    }

    streakMap.set(quizId, streak);
  }

  const completedQuizIds = new Set(todayAttempts.map((a) => a.quizId));
  const rankMap = new Map(userRanks.map((r) => [r.quizId, r.rank]));

  return dailyQuizzes.map((quiz) => ({
    ...quiz,
    completedToday: completedQuizIds.has(quiz.id),
    streakCount: streakMap.get(quiz.id) ?? 0,
    userRank: rankMap.get(quiz.id),
  }));
}
