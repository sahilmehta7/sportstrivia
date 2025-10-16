import { Prisma, UserRole } from "@prisma/client";

/**
 * Type-safe DTO for user list filters
 */
export interface UserListFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  hasStreak?: boolean;
  sortBy?: "createdAt" | "name" | "streak" | "attempts";
  sortOrder?: "asc" | "desc";
}

/**
 * Build type-safe where clause for user queries
 */
export function buildUserWhereClause(filters: UserListFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.hasStreak) {
    where.currentStreak = { gt: 0 };
  }

  return where;
}

/**
 * Build type-safe order by clause for user queries
 */
export function buildUserOrderBy(
  sortBy: "createdAt" | "name" | "streak" | "attempts" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Prisma.UserOrderByWithRelationInput {
  switch (sortBy) {
    case "name":
      return { name: sortOrder };
    case "streak":
      return { currentStreak: sortOrder };
    case "attempts":
      return { quizAttempts: { _count: sortOrder } };
    case "createdAt":
    default:
      return { createdAt: sortOrder };
  }
}

/**
 * Standard user include for list queries
 */
export const userListInclude: Prisma.UserInclude = {
  _count: {
    select: {
      quizAttempts: true,
      reviews: true,
      friends: true,
      badges: true,
    },
  },
};

/**
 * User select for public/minimal display
 */
export const publicUserSelect = {
  id: true,
  name: true,
  image: true,
  currentStreak: true,
  longestStreak: true,
} satisfies Prisma.UserSelect;

