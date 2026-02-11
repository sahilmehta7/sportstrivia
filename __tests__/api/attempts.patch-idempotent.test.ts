jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
      ...init,
    }),
  },
  NextRequest: class {},
  after: jest.fn(),
}));

import { PATCH } from "@/app/api/attempts/[id]/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/scoring/computeQuizScale", () => ({
  computeQuizScale: jest.fn(() => 1),
}));

jest.mock("@/lib/scoring/computeQuestionScore", () => ({
  computeQuestionScore: jest.fn(() => 10),
}));

jest.mock("@/lib/services/awardCompletionBonus", () => ({
  awardCompletionBonusIfEligible: jest.fn().mockResolvedValue(0),
}));

jest.mock("@/lib/services/badge.service", () => ({
  checkAndAwardBadges: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/lib/services/gamification.service", () => ({
  recomputeUserProgress: jest.fn().mockResolvedValue(null),
}));

jest.mock("@/lib/services/notification.service", () => ({
  createNotification: jest.fn().mockResolvedValue(null),
}));

jest.mock("@/lib/services/progression.service", () => ({
  applyProgression: jest.fn().mockResolvedValue(null),
}));

var prismaMock: any;
jest.mock("@/lib/db", () => {
  prismaMock = {
    quizAttempt: {
      findUnique: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    userAnswer: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { prisma: prismaMock };
});

const { requireAuth } = require("@/lib/auth-helpers") as {
  requireAuth: jest.Mock;
};

describe("PATCH /api/attempts/[id] idempotency and duplicate handling", () => {
  const questionId = "climitquestion000000000001";
  const correctAnswerId = "climitanswer00000000000001";
  const wrongAnswerId = "climitanswer00000000000002";

  beforeEach(() => {
    jest.clearAllMocks();
    requireAuth.mockResolvedValue({ id: "user_1" });
  });

  it("deduplicates repeated question answers in a single batched payload", async () => {
    prismaMock.quizAttempt.findUnique
      .mockResolvedValueOnce({
        id: "attempt_1",
        userId: "user_1",
        quizId: "quiz_1",
        startedAt: new Date("2026-02-11T00:00:00.000Z"),
        completedAt: null,
        totalQuestions: 1,
        isPracticeMode: false,
        selectedQuestionIds: [questionId],
        quiz: {
          id: "quiz_1",
          slug: "quiz-1",
          passingScore: 70,
          completionBonus: 0,
          timePerQuestion: 60,
          sport: "Basketball",
          topicConfigs: [{ topicId: "topic_1" }],
        },
        userAnswers: [],
      })
      .mockResolvedValueOnce({
        id: "attempt_1",
        userId: "user_1",
        quizId: "quiz_1",
        startedAt: new Date("2026-02-11T00:00:00.000Z"),
        completedAt: null,
        totalQuestions: 1,
        isPracticeMode: false,
        quiz: {
          id: "quiz_1",
          slug: "quiz-1",
          passingScore: 70,
          completionBonus: 0,
          timePerQuestion: 60,
          sport: "Basketball",
          topicConfigs: [{ topicId: "topic_1" }],
        },
        userAnswers: [
          {
            id: "ua_1",
            questionId,
            answerId: correctAnswerId,
            isCorrect: true,
            wasSkipped: false,
            timeSpent: 5,
            basePoints: 0,
            timeBonus: 0,
            streakBonus: 0,
            totalPoints: 0,
            createdAt: new Date("2026-02-11T00:00:05.000Z"),
            answer: { id: correctAnswerId, answerText: "Answer 1", answerImageUrl: null },
            question: {
              id: questionId,
              questionText: "Q1",
              explanation: null,
              explanationImageUrl: null,
              explanationVideoUrl: null,
              timeLimit: 60,
              difficulty: "MEDIUM",
            },
          },
        ],
      });

    prismaMock.question.findMany.mockResolvedValue([
      {
        id: questionId,
        answers: [
          { id: correctAnswerId, isCorrect: true },
          { id: wrongAnswerId, isCorrect: false },
        ],
      },
    ]);

    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        userAnswer: { update: jest.fn().mockResolvedValue(null) },
        quizAttempt: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          findUnique: jest.fn().mockResolvedValue({
            id: "attempt_1",
            quizId: "quiz_1",
            score: 100,
            passed: true,
            quiz: { slug: "quiz-1" },
            userAnswers: [],
          }),
        },
      };
      return cb(tx);
    });

    const response = await PATCH(
      {
        json: jest.fn().mockResolvedValue({
          answers: [
            { questionId, answerId: correctAnswerId, timeSpent: 5 },
            { questionId, answerId: wrongAnswerId, timeSpent: 7 },
          ],
        }),
      } as any,
      { params: Promise.resolve({ id: "attempt_1" }) }
    );

    const createManyCall = prismaMock.userAnswer.createMany.mock.calls[0][0];
    expect(createManyCall.data).toHaveLength(1);
    expect(createManyCall.skipDuplicates).toBe(true);

    const json = await response.json();
    expect(json.data.bonusStatus).toBe("PENDING");
    expect(json.data.completionBonusAwarded).toBeNull();
  });

  it("returns APPLIED status when attempt was already completed by another request", async () => {
    prismaMock.quizAttempt.findUnique
      .mockResolvedValueOnce({
        id: "attempt_2",
        userId: "user_1",
        quizId: "quiz_1",
        startedAt: new Date("2026-02-11T00:00:00.000Z"),
        completedAt: null,
        totalQuestions: 1,
        isPracticeMode: false,
        selectedQuestionIds: [questionId],
        quiz: {
          id: "quiz_1",
          slug: "quiz-1",
          passingScore: 70,
          completionBonus: 0,
          timePerQuestion: 60,
          sport: "Basketball",
          topicConfigs: [{ topicId: "topic_1" }],
        },
        userAnswers: [],
      })
      .mockResolvedValueOnce({
        id: "attempt_2",
        userId: "user_1",
        quizId: "quiz_1",
        startedAt: new Date("2026-02-11T00:00:00.000Z"),
        completedAt: null,
        totalQuestions: 1,
        isPracticeMode: false,
        quiz: {
          id: "quiz_1",
          slug: "quiz-1",
          passingScore: 70,
          completionBonus: 0,
          timePerQuestion: 60,
          sport: "Basketball",
          topicConfigs: [{ topicId: "topic_1" }],
        },
        userAnswers: [],
      })
      .mockResolvedValueOnce({
        id: "attempt_2",
        quizId: "quiz_1",
        score: 100,
        passed: true,
        quiz: { slug: "quiz-1" },
      });

    prismaMock.question.findMany.mockResolvedValue([]);

    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        userAnswer: { update: jest.fn().mockResolvedValue(null) },
        quizAttempt: {
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          findUnique: jest.fn(),
        },
      };
      return cb(tx);
    });

    const response = await PATCH(
      { json: jest.fn().mockResolvedValue({ answers: [] }) } as any,
      { params: Promise.resolve({ id: "attempt_2" }) }
    );
    const json = await response.json();

    expect(json.data.bonusStatus).toBe("APPLIED");
    expect(json.data.completionBonusAwarded).toBeNull();
  });
});
