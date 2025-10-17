jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

import { AttemptResetPeriod, type PrismaClient } from "@prisma/client";
import { AttemptLimitError } from "@/lib/errors";
import {
  checkAttemptLimit,
  getAttemptWindowStart,
  getNextResetAt,
} from "@/lib/services/attempt-limit.service";

describe("attempt-limit.service", () => {
  const referenceDate = new Date("2024-05-15T15:30:00.000Z");

  const createPrismaMock = (countImplementation?: jest.Mock) => {
    const countMock = countImplementation ?? jest.fn();
    const prisma = {
      quizAttempt: {
        count: countMock,
      },
    } as unknown as PrismaClient;

    return { prisma, countMock };
  };

  const baseQuiz = {
    id: "quiz_123",
    maxAttemptsPerUser: 3,
    attemptResetPeriod: AttemptResetPeriod.DAILY as const,
  };

  describe("getAttemptWindowStart", () => {
    it("returns null for NEVER period", () => {
      const start = getAttemptWindowStart(AttemptResetPeriod.NEVER, referenceDate);
      expect(start).toBeNull();
    });

    it("calculates daily window start at midnight UTC", () => {
      const start = getAttemptWindowStart(AttemptResetPeriod.DAILY, referenceDate);
      expect(start?.toISOString()).toBe("2024-05-15T00:00:00.000Z");
    });

    it("calculates weekly window start on Sunday midnight UTC", () => {
      // Wednesday -> expect previous Sunday
      const wednesday = new Date("2024-05-15T15:30:00.000Z");
      const start = getAttemptWindowStart(AttemptResetPeriod.WEEKLY, wednesday);
      expect(start?.toISOString()).toBe("2024-05-12T00:00:00.000Z");
    });

    it("calculates monthly window start on first day midnight UTC", () => {
      const start = getAttemptWindowStart(AttemptResetPeriod.MONTHLY, referenceDate);
      expect(start?.toISOString()).toBe("2024-05-01T00:00:00.000Z");
    });
  });

  describe("getNextResetAt", () => {
    it("returns null for NEVER period", () => {
      expect(getNextResetAt(AttemptResetPeriod.NEVER, referenceDate)).toBeNull();
    });

    it("adds one day for DAILY period", () => {
      expect(getNextResetAt(AttemptResetPeriod.DAILY, referenceDate)?.toISOString()).toBe(
        "2024-05-16T00:00:00.000Z"
      );
    });

    it("adds one week for WEEKLY period", () => {
      expect(getNextResetAt(AttemptResetPeriod.WEEKLY, referenceDate)?.toISOString()).toBe(
        "2024-05-19T00:00:00.000Z"
      );
    });

    it("rolls forward one month for MONTHLY period", () => {
      expect(getNextResetAt(AttemptResetPeriod.MONTHLY, referenceDate)?.toISOString()).toBe(
        "2024-06-01T00:00:00.000Z"
      );
    });
  });

  describe("checkAttemptLimit", () => {
    it("returns null when quiz has unlimited attempts", async () => {
      const { prisma, countMock } = createPrismaMock();

      const result = await checkAttemptLimit(prisma, {
        userId: "user_1",
        quiz: {
          id: "quiz_unlimited",
          maxAttemptsPerUser: null,
          attemptResetPeriod: AttemptResetPeriod.NEVER,
        },
      });

      expect(result).toBeNull();
      expect(countMock).not.toHaveBeenCalled();
    });

    it("returns null when practice mode is enabled", async () => {
      const { prisma, countMock } = createPrismaMock();

      const result = await checkAttemptLimit(prisma, {
        userId: "user_1",
        quiz: baseQuiz,
        isPracticeMode: true,
      });

      expect(result).toBeNull();
      expect(countMock).not.toHaveBeenCalled();
    });

    it("throws AttemptLimitError when attempts exceed limit", async () => {
      const { prisma, countMock } = createPrismaMock();
      countMock.mockResolvedValue(3);

      await expect(
        checkAttemptLimit(prisma, {
          userId: "user_1",
          quiz: baseQuiz,
          referenceDate,
        })
      ).rejects.toBeInstanceOf(AttemptLimitError);

      expect(countMock).toHaveBeenCalledTimes(1);
    });

    it("returns metadata when attempts are still available", async () => {
      const { prisma, countMock } = createPrismaMock();
      countMock.mockResolvedValue(1);

      const result = await checkAttemptLimit(prisma, {
        userId: "user_1",
        quiz: baseQuiz,
        referenceDate,
      });

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        max: 3,
        used: 1,
        remainingBeforeStart: 2,
        period: AttemptResetPeriod.DAILY,
      });
      expect(result?.resetAt?.toISOString()).toBe("2024-05-16T00:00:00.000Z");
      expect(result?.windowStart?.toISOString()).toBe("2024-05-15T00:00:00.000Z");
      expect(result?.referenceDate.toISOString()).toBe(referenceDate.toISOString());
    });
  });
});
