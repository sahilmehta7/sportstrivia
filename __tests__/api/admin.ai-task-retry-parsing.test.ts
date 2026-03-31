/** @jest-environment node */

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/services/background-task.service", () => ({
  getAdminBackgroundTaskOrThrow: jest.fn(),
  updateBackgroundTask: jest.fn(),
  markBackgroundTaskCompletedFromFailed: jest.fn(),
}));

import { POST } from "@/app/api/admin/ai-tasks/[id]/retry-parsing/route";
import { requireAdmin } from "@/lib/auth-helpers";
import { NotFoundError } from "@/lib/errors";

const {
  getAdminBackgroundTaskOrThrow,
  updateBackgroundTask,
  markBackgroundTaskCompletedFromFailed,
} = require("@/lib/services/background-task.service");

describe("/api/admin/ai-tasks/[id]/retry-parsing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1", role: "ADMIN" });
    updateBackgroundTask.mockResolvedValue({});
    markBackgroundTaskCompletedFromFailed.mockResolvedValue({ id: "task_1", status: "COMPLETED" });
  });

  it("completes a FAILED AI quiz task after successful parse retry", async () => {
    getAdminBackgroundTaskOrThrow.mockResolvedValue({
      id: "task_1",
      userId: "admin_1",
      type: "AI_QUIZ_GENERATION",
      status: "FAILED",
      attempt: 2,
      cancelledAttempt: null,
      input: {
        topic: "NBA Finals",
        effectiveTopic: "NBA Finals",
        quizSport: "Basketball",
        difficulty: "MEDIUM",
        numQuestions: 3,
      },
      result: {
        rawResponse: {
          rawGeneratedContent: JSON.stringify({
            title: "NBA Finals Quiz",
            difficulty: "medium",
            questions: [{ question: "Q1", options: ["A", "B", "C", "D"], correctAnswer: 0 }],
          }),
          rawCompletion: { object: "chat.completion", usage: { total_tokens: 123 } },
          prompt: "prompt text",
        },
      },
    });

    const response = await POST(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "task_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(markBackgroundTaskCompletedFromFailed).toHaveBeenCalledWith(
      "task_1",
      expect.objectContaining({
        quiz: expect.any(Object),
        parseRetrySuccessful: true,
      }),
      2
    );
    expect(body.data.status).toBe("completed");
  });

  it("completes a FAILED AI topic-question task after successful parse retry", async () => {
    getAdminBackgroundTaskOrThrow.mockResolvedValue({
      id: "task_2",
      userId: "admin_1",
      type: "AI_TOPIC_QUESTION_GENERATION",
      status: "FAILED",
      attempt: 1,
      cancelledAttempt: null,
      input: {
        topicId: "topic_1",
        topicName: "Basketball",
        model: "gpt-4o",
        easyCount: 1,
        mediumCount: 0,
        hardCount: 0,
        total: 1,
      },
      result: {
        rawResponse: {
          rawGeneratedContent: JSON.stringify({
            questions: [
              {
                questionText: "Who won?",
                difficulty: "easy",
                answers: [{ answerText: "Lakers", isCorrect: true }],
              },
            ],
          }),
          rawCompletion: { object: "chat.completion", usage: { total_tokens: 55 } },
          prompt: "prompt text",
        },
      },
    });

    const response = await POST(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "task_2" }),
    });

    expect(response.status).toBe(200);
    expect(markBackgroundTaskCompletedFromFailed).toHaveBeenCalledWith(
      "task_2",
      expect.objectContaining({
        questions: expect.any(Array),
        parseRetrySuccessful: true,
      }),
      1
    );
  });

  it("rejects cancelled attempts", async () => {
    getAdminBackgroundTaskOrThrow.mockResolvedValue({
      id: "task_3",
      userId: "admin_1",
      type: "AI_QUIZ_GENERATION",
      status: "FAILED",
      attempt: 3,
      cancelledAttempt: 3,
      input: {},
      result: { rawResponse: { rawGeneratedContent: "{}" } },
    });

    const response = await POST(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "task_3" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("cancelled task attempt");
    expect(markBackgroundTaskCompletedFromFailed).not.toHaveBeenCalled();
  });

  it("returns conflict when guarded completion write is rejected", async () => {
    getAdminBackgroundTaskOrThrow.mockResolvedValue({
      id: "task_4",
      userId: "admin_1",
      type: "AI_QUIZ_GENERATION",
      status: "FAILED",
      attempt: 1,
      cancelledAttempt: null,
      input: {
        topic: "NBA Finals",
        effectiveTopic: "NBA Finals",
        quizSport: "Basketball",
        difficulty: "MEDIUM",
        numQuestions: 1,
      },
      result: {
        rawResponse: {
          rawGeneratedContent: JSON.stringify({
            title: "Quiz",
            questions: [{ question: "Q1", options: ["A", "B", "C", "D"], correctAnswer: 0 }],
          }),
          rawCompletion: { object: "chat.completion", usage: { total_tokens: 10 } },
          prompt: "prompt",
        },
      },
    });
    markBackgroundTaskCompletedFromFailed.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "task_4" }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("state changed");
  });

  it("returns 404 when task is missing", async () => {
    getAdminBackgroundTaskOrThrow.mockRejectedValue(new NotFoundError("Task not found"));

    const response = await POST(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "task_unauthorized" }),
    });

    expect(response.status).toBe(404);
    expect(markBackgroundTaskCompletedFromFailed).not.toHaveBeenCalled();
  });
});
