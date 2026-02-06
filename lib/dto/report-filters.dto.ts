import { Prisma, ReportStatus } from "@prisma/client";

/**
 * Type-safe DTO for report list filters
 */
export interface ReportListFilters {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  category?: string;
  sortBy?: "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

/**
 * Build type-safe where clause for report queries
 */
export function buildReportWhereClause(filters: ReportListFilters): Prisma.QuestionReportWhereInput {
  const where: Prisma.QuestionReportWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.category) {
    where.question = {
      topic: {
        slug: filters.category,
      },
    };
  }

  return where;
}

/**
 * Standard report include for queries
 */
export const reportInclude: Prisma.QuestionReportInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  question: {
    select: {
      id: true,
      questionText: true,
      difficulty: true,
      topic: {
        select: {
          name: true,
        },
      },
    },
  },
};

