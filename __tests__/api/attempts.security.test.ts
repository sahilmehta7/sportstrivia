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

import { POST } from "@/app/api/attempts/route";
import { GET as getNextQuestion } from "@/app/api/attempts/[id]/next/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/services/attempt-limit.service", () => ({
  checkAttemptLimit: jest.fn().mockResolvedValue(null),
}));

jest.mock("@/lib/services/topic.service", () => ({
  getTopicIdsWithDescendants: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  shuffleArray: (input: any[]) => input,
}));

var prismaMock: any;
jest.mock("@/lib/db", () => {
  const tx = {
    quizAttempt: {
      create: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
  };
  prismaMock = {
    quiz: {
      findUnique: jest.fn(),
    },
    question: {
      findUnique: jest.fn(),
    },
    quizAttempt: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (cb: any) => cb(tx)),
    __tx: tx,
  };
  return { prisma: prismaMock };
});

const { requireAuth } = require("@/lib/auth-helpers") as {
  requireAuth: jest.Mock;
};

describe("attempt API security contracts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuth.mockResolvedValue({ id: "user_1" });
  });

  it("POST /api/attempts does not return answer keys or explanations", async () => {
    prismaMock.quiz.findUnique.mockResolvedValue({
      id: "climitquiz000000000000001",
      isPublished: true,
      status: "PUBLISHED",
      startTime: null,
      endTime: null,
      questionSelectionMode: "FIXED",
      randomizeQuestionOrder: false,
      questionPool: [{ questionId: "q1", order: 0 }],
      topicConfigs: [],
    });

    prismaMock.__tx.quizAttempt.create.mockResolvedValue({
      id: "attempt_1",
        quizId: "climitquiz000000000000001",
      startedAt: new Date("2026-02-11T00:00:00.000Z"),
      totalQuestions: 1,
      isPracticeMode: false,
      quiz: {
        title: "Test Quiz",
        slug: "test-quiz",
        duration: 60,
        timePerQuestion: 60,
        passingScore: 70,
        showHints: true,
        negativeMarkingEnabled: false,
        penaltyPercentage: 0,
        bonusPointsPerSecond: 0,
        timeBonusEnabled: false,
      },
    });

    prismaMock.__tx.question.findMany.mockResolvedValue([
      {
        id: "q1",
        questionText: "Who won?",
        questionImageUrl: null,
        questionVideoUrl: null,
        questionAudioUrl: null,
        hint: null,
        explanation: "Because",
        explanationImageUrl: null,
        explanationVideoUrl: null,
        timeLimit: 30,
        answers: [
          { id: "a1", answerText: "A", answerImageUrl: null, answerVideoUrl: null, answerAudioUrl: null, isCorrect: true },
          { id: "a2", answerText: "B", answerImageUrl: null, answerVideoUrl: null, answerAudioUrl: null, isCorrect: false },
        ],
      },
    ]);

    const response = await POST({
      json: jest.fn().mockResolvedValue({ quizId: "climitquiz000000000000001", isPracticeMode: false }),
    } as any);

    const json = await response.json();
    expect(json.data.questions).toHaveLength(1);
    expect(json.data.questions[0].correctAnswerId).toBeUndefined();
    expect(json.data.questions[0].explanation).toBeUndefined();
    expect(json.data.questions[0].explanationImageUrl).toBeUndefined();
    expect(json.data.questions[0].explanationVideoUrl).toBeUndefined();
  });

  it("GET /api/attempts/[id]/next does not return answer keys or explanations", async () => {
    prismaMock.quizAttempt.findUnique.mockResolvedValue({
      id: "attempt_1",
      userId: "user_1",
      completedAt: null,
      selectedQuestionIds: ["q1"],
      totalQuestions: 1,
      userAnswers: [],
    });

    prismaMock.question.findUnique.mockResolvedValue({
      id: "q1",
      questionText: "Question?",
      questionImageUrl: null,
      questionVideoUrl: null,
      questionAudioUrl: null,
      hint: null,
      explanation: "Explanation",
      explanationImageUrl: null,
      explanationVideoUrl: null,
      timeLimit: 30,
      answers: [
        { id: "a1", answerText: "A", answerImageUrl: null, answerVideoUrl: null, answerAudioUrl: null, displayOrder: 0, isCorrect: true },
        { id: "a2", answerText: "B", answerImageUrl: null, answerVideoUrl: null, answerAudioUrl: null, displayOrder: 1, isCorrect: false },
      ],
    });

    const response = await getNextQuestion(
      {} as any,
      { params: Promise.resolve({ id: "attempt_1" }) }
    );
    const json = await response.json();

    expect(json.data.nextQuestion).toBeTruthy();
    expect(json.data.nextQuestion.correctAnswerId).toBeUndefined();
    expect(json.data.nextQuestion.explanation).toBeUndefined();
    expect(json.data.nextQuestion.explanationImageUrl).toBeUndefined();
    expect(json.data.nextQuestion.explanationVideoUrl).toBeUndefined();
  });
});
