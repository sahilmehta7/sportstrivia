import { Prisma } from "@prisma/client";

/**
 * Type-safe DTO for review list filters
 */
export interface ReviewListFilters {
  page?: number;
  limit?: number;
  rating?: number;
  sortBy?: "createdAt" | "rating" | "helpful";
  sortOrder?: "asc" | "desc";
}

/**
 * Build type-safe where clause for review queries
 */
export function buildReviewWhereClause(
  quizId: string,
  filters: ReviewListFilters
): Prisma.QuizReviewWhereInput {
  const where: Prisma.QuizReviewWhereInput = {
    quizId,
  };

  if (filters.rating) {
    where.rating = filters.rating;
  }

  return where;
}

/**
 * Build type-safe order by clause for review queries
 */
export function buildReviewOrderBy(
  sortBy: "createdAt" | "rating" | "helpful" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Prisma.QuizReviewOrderByWithRelationInput {
  switch (sortBy) {
    case "rating":
      return { rating: sortOrder };
    case "helpful":
      return { helpfulCount: sortOrder };
    case "createdAt":
    default:
      return { createdAt: sortOrder };
  }
}

/**
 * Standard review include for queries
 */
export const reviewInclude: Prisma.QuizReviewInclude = {
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
};

