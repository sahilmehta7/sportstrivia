import { AttemptResetPeriod, PrismaClient } from "@prisma/client";

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
