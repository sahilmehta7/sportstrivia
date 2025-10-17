import { AttemptResetPeriod, PrismaClient, type Quiz } from "@prisma/client";
import { AttemptLimitError } from "@/lib/errors";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

export function getAttemptWindowStart(
  period: AttemptResetPeriod,
  referenceDate: Date = new Date()
): Date | null {
  const date = new Date(referenceDate);

  switch (period) {
    case "DAILY": {
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }
    case "WEEKLY": {
      const day = date.getUTCDay();
      const diff = day; // Sunday as start of week
      const reset = new Date(date.getTime() - diff * MS_PER_DAY);
      reset.setUTCHours(0, 0, 0, 0);
      return reset;
    }
    case "MONTHLY": {
      const reset = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
      return reset;
    }
    case "NEVER":
    default:
      return null;
  }
}

export function getNextResetAt(
  period: AttemptResetPeriod,
  referenceDate: Date = new Date()
): Date | null {
  const windowStart = getAttemptWindowStart(period, referenceDate);
  if (!windowStart) {
    return null;
  }

  switch (period) {
    case "DAILY":
      return new Date(windowStart.getTime() + MS_PER_DAY);
    case "WEEKLY":
      return new Date(windowStart.getTime() + MS_PER_WEEK);
    case "MONTHLY": {
      const nextMonth = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth() + 1, 1, 0, 0, 0, 0));
      return nextMonth;
    }
    case "NEVER":
    default:
      return null;
  }
}

export async function countUserAttemptsWithinWindow(
  prisma: PrismaClient,
  params: {
    userId: string;
    quizId: string;
    windowStart: Date | null;
  }
): Promise<number> {
  return prisma.quizAttempt.count({
    where: {
      userId: params.userId,
      quizId: params.quizId,
      isPracticeMode: false,
      ...(params.windowStart
        ? {
            startedAt: {
              gte: params.windowStart,
            },
          }
        : {}),
    },
  });
}

export interface AttemptLimitCheckParams {
  userId: string;
  quiz: Pick<Quiz, "id" | "maxAttemptsPerUser" | "attemptResetPeriod">;
  isPracticeMode?: boolean;
  referenceDate?: Date;
}

export interface AttemptLimitCheckResult {
  max: number;
  used: number;
  remainingBeforeStart: number;
  period: AttemptResetPeriod;
  windowStart: Date | null;
  resetAt: Date | null;
  referenceDate: Date;
  isLimitReached: boolean;
}

export async function getAttemptLimitStatus(
  prisma: PrismaClient,
  params: AttemptLimitCheckParams
): Promise<AttemptLimitCheckResult | null> {
  const { userId, quiz, isPracticeMode = false, referenceDate } = params;

  if (isPracticeMode || !quiz.maxAttemptsPerUser) {
    return null;
  }

  const now = referenceDate ?? new Date();
  const windowStart = getAttemptWindowStart(quiz.attemptResetPeriod, now);
  const attemptsUsed = await countUserAttemptsWithinWindow(prisma, {
    userId,
    quizId: quiz.id,
    windowStart,
  });

  const remainingBeforeStart = Math.max(quiz.maxAttemptsPerUser - attemptsUsed, 0);

  return {
    max: quiz.maxAttemptsPerUser,
    used: attemptsUsed,
    remainingBeforeStart,
    period: quiz.attemptResetPeriod,
    windowStart,
    resetAt: getNextResetAt(quiz.attemptResetPeriod, now),
    referenceDate: now,
    isLimitReached: remainingBeforeStart <= 0,
  };
}

export async function checkAttemptLimit(
  prisma: PrismaClient,
  params: AttemptLimitCheckParams
): Promise<AttemptLimitCheckResult | null> {
  const status = await getAttemptLimitStatus(prisma, params);

  if (!status) {
    return null;
  }

  if (status.isLimitReached) {
    throw new AttemptLimitError(status.max, status.period, status.resetAt);
  }

  return status;
}
