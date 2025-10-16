import { Prisma, FriendStatus } from "@prisma/client";

/**
 * Type-safe DTO for friend list filters
 */
export interface FriendListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: FriendStatus;
  sortBy?: "createdAt" | "name";
  sortOrder?: "asc" | "desc";
}

/**
 * Build type-safe where clause for friend queries (as requester)
 */
export function buildFriendWhereClause(
  userId: string,
  filters: FriendListFilters
): Prisma.FriendWhereInput {
  const where: Prisma.FriendWhereInput = {
    userId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.friend = {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  return where;
}

/**
 * Build type-safe where clause for received friend requests
 */
export function buildReceivedFriendRequestsWhereClause(
  userId: string,
  filters: FriendListFilters
): Prisma.FriendWhereInput {
  const where: Prisma.FriendWhereInput = {
    friendId: userId,
    status: FriendStatus.PENDING,
  };

  if (filters.search) {
    where.user = {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  return where;
}

/**
 * Standard friend include for queries
 */
export const friendInclude: Prisma.FriendInclude = {
  friend: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      currentStreak: true,
      longestStreak: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
};

