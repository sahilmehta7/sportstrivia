import { AttemptResetPeriod } from "@prisma/client";
import { POST } from "@/app/api/attempts/route";
import { AttemptLimitError } from "@/lib/errors";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
  NextRequest: class {},
}));

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));

var prismaMock: {
  quiz: { findUnique: jest.Mock };
  question: { findMany: jest.Mock };
  quizAttempt: { create: jest.Mock };
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    quiz: {
      findUnique: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    quizAttempt: {
      create: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

jest.mock("@/lib/services/topic.service", () => ({
  getTopicIdsWithDescendants: jest.fn(),
}));

jest.mock("@/lib/services/attempt-limit.service", () => ({
  checkAttemptLimit: jest.fn(),
}));

const { requireAuth } = jest.requireMock("@/lib/auth-helpers") as {
  requireAuth: jest.Mock;
};
const { checkAttemptLimit } = jest.requireMock(
  "@/lib/services/attempt-limit.service"
) as {
  checkAttemptLimit: jest.Mock;
};

describe("POST /api/attempts - attempt limit handling", () => {
  const _baseUrl = "http://localhost/api/attempts";
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    requireAuth.mockResolvedValue({ id: "user_123" });

    prismaMock.quiz.findUnique.mockResolvedValue({
      id: "climitquiz000000000000001",
      isPublished: true,
      status: "PUBLISHED",
      startTime: null,
      endTime: null,
      questionSelectionMode: "FIXED",
      questionPool: [],
      topicConfigs: [],
      maxAttemptsPerUser: 3,
      attemptResetPeriod: AttemptResetPeriod.DAILY,
    });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it("returns ATTEMPT_LIMIT_REACHED payload when limit is exhausted", async () => {
    const resetAt = new Date("2024-05-01T00:00:00.000Z");
    checkAttemptLimit.mockRejectedValueOnce(
      new AttemptLimitError(3, AttemptResetPeriod.DAILY, resetAt)
    );

    const request = {
      json: jest.fn().mockResolvedValue({ quizId: "climitquiz000000000000001" }),
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(403);

    const json = await response.json();
    expect(json).toEqual({
      error: "Attempt limit reached",
      code: "ATTEMPT_LIMIT_REACHED",
      limit: 3,
      period: AttemptResetPeriod.DAILY,
      resetAt: resetAt.toISOString(),
    });

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(prismaMock.quiz.findUnique).toHaveBeenCalledTimes(1);
    expect(checkAttemptLimit).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: "user_123",
        quiz: expect.objectContaining({
          id: "climitquiz000000000000001",
        }),
      })
    );
  });
});
