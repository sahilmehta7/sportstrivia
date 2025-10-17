import { Prisma, Difficulty, QuizStatus } from "@prisma/client";

/**
 * Type-safe DTO for quiz list filters
 */
export interface QuizListFilters {
  page?: number;
  limit?: number;
  search?: string;
  sport?: string;
  difficulty?: Difficulty;
  status?: QuizStatus;
}

/**
 * Build type-safe where clause for quiz queries
 */
export function buildQuizWhereClause(filters: QuizListFilters): Prisma.QuizWhereInput {
  const where: Prisma.QuizWhereInput = {};

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.sport) {
    where.sport = filters.sport;
  }

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return where;
}

/**
 * Type-safe DTO for public quiz list filters
 */
export interface PublicQuizFilters {
  page?: number;
  limit?: number;
  search?: string;
  sport?: string;
  difficulty?: Difficulty;
  tag?: string;
  topic?: string;
  topicIds?: string[];
  isFeatured?: boolean;
  comingSoon?: boolean;
  minDuration?: number; // in seconds
  maxDuration?: number; // in seconds
  minRating?: number;
  sortBy?: "popularity" | "rating" | "createdAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Build type-safe where clause for public quiz queries
 */
export function buildPublicQuizWhereClause(filters: PublicQuizFilters): Prisma.QuizWhereInput {
  const where: Prisma.QuizWhereInput = {
    isPublished: true,
    status: "PUBLISHED",
  };

  const now = new Date();
  const andConditions: Prisma.QuizWhereInput[] = [];

  // Time-based filtering
  if (filters.comingSoon) {
    where.startTime = { gt: now };
  } else {
    andConditions.push({
      OR: [
        { startTime: null },
        { startTime: { lte: now } },
      ],
    });
    andConditions.push({
      OR: [
        { endTime: null },
        { endTime: { gte: now } },
      ],
    });
  }

  // Search filter
  if (filters.search) {
    andConditions.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  // Sport filter
  if (filters.sport) {
    where.sport = filters.sport;
  }

  // Difficulty filter
  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  // Duration filters
  if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
    where.duration = {};
    if (filters.minDuration !== undefined) {
      where.duration.gte = filters.minDuration;
    }
    if (filters.maxDuration !== undefined) {
      where.duration.lte = filters.maxDuration;
    }
  }

  // Rating filter
  if (filters.minRating !== undefined) {
    where.averageRating = { gte: filters.minRating };
  }

  // Featured filter
  if (filters.isFeatured) {
    where.isFeatured = true;
  }

  // Tag filter
  if (filters.tag) {
    where.tags = {
      some: {
        tag: {
          slug: filters.tag,
        },
      },
    };
  }

  // Topic filter
  const topicOrConditions: Prisma.QuizWhereInput[] = [];

  if (filters.topicIds && filters.topicIds.length > 0) {
    topicOrConditions.push(
      {
        topicConfigs: {
          some: {
            topicId: {
              in: filters.topicIds,
            },
          },
        },
      },
      {
        questionPool: {
          some: {
            question: {
              topicId: {
                in: filters.topicIds,
              },
            },
          },
        },
      }
    );
  }

  if (filters.topic) {
    topicOrConditions.push(
      {
        topicConfigs: {
          some: {
            topic: {
              slug: filters.topic,
            },
          },
        },
      },
      {
        tags: {
          some: {
            tag: {
              slug: filters.topic,
            },
          },
        },
      },
      {
        questionPool: {
          some: {
            question: {
              topic: {
                slug: filters.topic,
              },
            },
          },
        },
      }
    );
  }

  if (topicOrConditions.length > 0) {
    andConditions.push({ OR: topicOrConditions });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

/**
 * Build type-safe order by clause for quiz queries
 */
export function buildQuizOrderBy(
  sortBy: "popularity" | "rating" | "createdAt" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Prisma.QuizOrderByWithRelationInput | Prisma.QuizOrderByWithRelationInput[] {
  switch (sortBy) {
    case "popularity":
      return { attempts: { _count: sortOrder } };
    case "rating":
      return [
        { averageRating: sortOrder },
        { totalReviews: "desc" },
      ];
    case "createdAt":
    default:
      return { createdAt: sortOrder };
  }
}

/**
 * Standard pagination helper
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function calculatePagination(page: number, limit: number): { skip: number; take: number } {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildPaginationResult(page: number, limit: number, total: number): PaginationResult {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
}
