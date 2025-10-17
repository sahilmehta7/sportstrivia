import { Prisma, ChallengeStatus } from "@prisma/client";

/**
 * Type-safe DTO for challenge list filters
 */
export interface ChallengeListFilters {
  page?: number;
  limit?: number;
  status?: ChallengeStatus;
  type?: "sent" | "received" | "active";
  sortBy?: "createdAt" | "expiresAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Build type-safe where clause for sent challenges
 */
export function buildSentChallengesWhereClause(
  userId: string,
  filters: ChallengeListFilters
): Prisma.ChallengeWhereInput {
  const where: Prisma.ChallengeWhereInput = {
    challengerId: userId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  return where;
}

/**
 * Build type-safe where clause for received challenges
 */
export function buildReceivedChallengesWhereClause(
  userId: string,
  filters: ChallengeListFilters
): Prisma.ChallengeWhereInput {
  const where: Prisma.ChallengeWhereInput = {
    challengedId: userId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  return where;
}

/**
 * Standard challenge include for queries
 * Note: Challenge model stores scores directly (challengerScore, challengedScore)
 * not as relations to QuizAttempt
 */
export const challengeInclude: Prisma.ChallengeInclude = {
  challenger: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  challenged: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  quiz: {
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      duration: true,
    },
  },
};

