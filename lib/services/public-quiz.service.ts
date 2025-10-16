import { Difficulty, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  buildPaginationResult,
  buildPublicQuizWhereClause,
  buildQuizOrderBy,
  calculatePagination,
  type PaginationResult,
  type PublicQuizFilters,
} from "@/lib/dto/quiz-filters.dto";

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

export async function getPublicQuizList(
  input: PublicQuizFilters
): Promise<PublicQuizListResponse> {
  const page = input.page && input.page > 0 ? input.page : 1;
  const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 50) : 12;

  const filters: PublicQuizFilters = {
    ...input,
    page,
    limit,
  };

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
