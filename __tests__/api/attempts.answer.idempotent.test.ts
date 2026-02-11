jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
      ...init,
    }),
  },
  NextRequest: class {},
}));

import { PUT } from "@/app/api/attempts/[id]/answer/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));

var prismaMock: any;
jest.mock("@/lib/db", () => {
  prismaMock = {
    quizAttempt: { findUnique: jest.fn() },
    userAnswer: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    question: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

const { requireAuth } = require("@/lib/auth-helpers") as {
  requireAuth: jest.Mock;
};

describe("PUT /api/attempts/[id]/answer idempotency", () => {
  const questionId = "climitquestion000000000001";
  const answerId = "climitanswer00000000000001";

  beforeEach(() => {
    jest.clearAllMocks();
    requireAuth.mockResolvedValue({ id: "user_1" });
    prismaMock.quizAttempt.findUnique.mockResolvedValue({
      id: "attempt_1",
      userId: "user_1",
      completedAt: null,
      selectedQuestionIds: [questionId],
      quiz: { id: "quiz_1" },
    });
  });

  it("returns idempotent success when answer already exists", async () => {
    prismaMock.userAnswer.findUnique.mockResolvedValue({
      attemptId: "attempt_1",
      questionId,
      isCorrect: false,
      wasSkipped: false,
    });

    const response = await PUT(
      {
        json: jest.fn().mockResolvedValue({
          questionId,
          answerId,
          timeSpent: 12,
        }),
      } as any,
      { params: Promise.resolve({ id: "attempt_1" }) }
    );

    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.data.alreadySubmitted).toBe(true);
    expect(prismaMock.userAnswer.create).not.toHaveBeenCalled();
    expect(prismaMock.question.update).not.toHaveBeenCalled();
  });

  it("returns idempotent success on unique-conflict race", async () => {
    prismaMock.userAnswer.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        attemptId: "attempt_1",
        questionId,
        isCorrect: true,
        wasSkipped: false,
      });

    prismaMock.question.findUnique.mockResolvedValue({
      id: questionId,
      answers: [
        { id: answerId, isCorrect: true },
        { id: "a2", isCorrect: false },
      ],
    });

    const raceError = Object.assign(new Error("duplicate key"), { code: "P2002" });
    prismaMock.userAnswer.create.mockRejectedValue(raceError);

    const response = await PUT(
      {
        json: jest.fn().mockResolvedValue({
          questionId,
          answerId,
          timeSpent: 12,
        }),
      } as any,
      { params: Promise.resolve({ id: "attempt_1" }) }
    );

    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.data.alreadySubmitted).toBe(true);
    expect(prismaMock.question.update).not.toHaveBeenCalled();
  });
});
