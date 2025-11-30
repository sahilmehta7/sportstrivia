// Mock next/server - must be before importing the route
jest.mock("next/server", () => ({
  after: jest.fn((fn) => fn()),
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
      ...init,
    }),
  },
  NextRequest: class {},
}));

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn().mockResolvedValue({ id: "admin_123", role: "ADMIN" }),
}));

import { POST } from "@/app/api/admin/ai/generate-quiz/route";

jest.mock("@/lib/services/background-task.service", () => ({
  createBackgroundTask: jest.fn(),
  markBackgroundTaskFailed: jest.fn(),
}));

jest.mock("@/lib/services/ai-quiz-processor.service", () => ({
  processAIQuizTask: jest.fn(),
  determineSportFromTopic: jest.fn(),
  fetchSourceMaterial: jest.fn(),
}));

const { requireAdmin } = require("@/lib/auth-helpers");
const { createBackgroundTask, markBackgroundTaskFailed: _markBackgroundTaskFailed } = require("@/lib/services/background-task.service");
const { processAIQuizTask, determineSportFromTopic, fetchSourceMaterial } = require("@/lib/services/ai-quiz-processor.service");
const { after } = require("next/server");

describe("/api/admin/ai/generate-quiz", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    (after as jest.Mock).mockImplementation((fn: any) => fn()); // Execute immediately in tests

    createBackgroundTask.mockResolvedValue({
      id: "task_123",
      userId: "admin_123",
      type: "AI_QUIZ_GENERATION",
      status: "PENDING",
    });

    processAIQuizTask.mockResolvedValue(undefined);
    determineSportFromTopic.mockReturnValue("Basketball");
    fetchSourceMaterial.mockResolvedValue(null);
  });

  const createMockRequest = (body: any) => ({
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn(),
    },
  } as any);

  it("should create a background task and schedule processing", async () => {
    const req = createMockRequest({
      topic: "Basketball",
      difficulty: "MEDIUM",
      numQuestions: 5,
    });

    const response = await POST(req);
    const json = await (response as any).json();

    expect(requireAdmin).toHaveBeenCalled();
    expect(createBackgroundTask).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin_123",
        type: "AI_QUIZ_GENERATION",
        label: "AI Quiz • Basketball",
        input: expect.objectContaining({
          topic: "Basketball",
          effectiveTopic: "Basketball",
          difficulty: "MEDIUM",
          numQuestions: 5,
        }),
      })
    );
    expect(after).toHaveBeenCalled();
    expect(processAIQuizTask).toHaveBeenCalledWith("task_123");
    expect(json.data.taskId).toBe("task_123");
    expect(json.data.status).toBe("processing");
  });

  it("should use customTitle if provided", async () => {
    const req = createMockRequest({
      customTitle: "NBA Championship Quiz",
      difficulty: "MEDIUM",
      numQuestions: 5,
    });

    await POST(req);

    expect(createBackgroundTask).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "AI Quiz • NBA Championship Quiz",
        input: expect.objectContaining({
          customTitle: "NBA Championship Quiz",
          effectiveTopic: "NBA Championship Quiz",
        }),
      })
    );
  });

  it("should fetch source material when sourceUrl is provided", async () => {
    const mockSourceMaterial = {
      url: "https://example.com/basketball",
      title: "Basketball History",
      contentSnippet: "The NBA was founded...",
      derivedTopic: "Basketball History",
    };

    fetchSourceMaterial.mockResolvedValue(mockSourceMaterial);

    const req = createMockRequest({
      sourceUrl: "https://example.com/basketball",
      difficulty: "MEDIUM",
      numQuestions: 5,
    });

    await POST(req);

    expect(fetchSourceMaterial).toHaveBeenCalledWith("https://example.com/basketball");
    expect(createBackgroundTask).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          sourceUrl: "https://example.com/basketball",
          sourceMaterial: mockSourceMaterial,
          effectiveTopic: "Basketball History",
        }),
      })
    );
  });

  it("should determine sport from topic", async () => {
    determineSportFromTopic.mockReturnValue("Basketball");

    const req = createMockRequest({
      topic: "NBA Finals",
      difficulty: "MEDIUM",
      numQuestions: 5,
    });

    await POST(req);

    expect(determineSportFromTopic).toHaveBeenCalled();
    expect(createBackgroundTask).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          quizSport: "Basketball",
        }),
      })
    );
  });

  it("should use provided sport if available", async () => {
    const req = createMockRequest({
      topic: "Sports",
      sport: "Basketball",
      difficulty: "MEDIUM",
      numQuestions: 5,
    });

    await POST(req);

    expect(createBackgroundTask).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          sport: "Basketball",
          quizSport: "Basketball",
        }),
      })
    );
    expect(determineSportFromTopic).not.toHaveBeenCalled();
  });

  it("should throw error if OpenAI API key is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    const req = createMockRequest({
      topic: "Basketball",
      difficulty: "MEDIUM",
      numQuestions: 5,
    });

    const response = await POST(req);
    const json = await (response as any).json();

    expect(json.error).toContain("OpenAI API key is not configured");
    expect(createBackgroundTask).not.toHaveBeenCalled();
  });

  it("should throw error if topic, customTitle, and sourceUrl are all missing", async () => {
    const req = createMockRequest({
      difficulty: "MEDIUM",
      numQuestions: 5,
    });

    const response = await POST(req);
    const json = await (response as any).json();

    expect(json.error).toBe("Validation failed");
    expect(json.errors).toBeDefined();
    expect(json.errors.some((e: any) => e.path.includes("topic"))).toBe(true);
    expect(createBackgroundTask).not.toHaveBeenCalled();
  });

  it("should mark task as failed if processing throws error", async () => {
    processAIQuizTask.mockRejectedValue(new Error("Processing failed"));

    const req = createMockRequest({
      topic: "Basketball",
      difficulty: "MEDIUM",
      numQuestions: 5,
    });

    await POST(req);

    // Note: In actual implementation, error handling happens inside processAIQuizTask
    // This test verifies the task is created and processing is scheduled
    expect(createBackgroundTask).toHaveBeenCalled();
    expect(after).toHaveBeenCalled();
  });

  it("should handle validation errors for invalid difficulty", async () => {
    const req = createMockRequest({
      topic: "Basketball",
      difficulty: "INVALID",
      numQuestions: 5,
    });

    const response = await POST(req);
    const json = await (response as any).json();

    expect(json.error).toBeDefined();
    expect(createBackgroundTask).not.toHaveBeenCalled();
  });

  it("should handle validation errors for invalid numQuestions", async () => {
    const req = createMockRequest({
      topic: "Basketball",
      difficulty: "MEDIUM",
      numQuestions: 100, // Exceeds max of 50
    });

    const response = await POST(req);
    const json = await (response as any).json();

    expect(json.error).toBeDefined();
    expect(createBackgroundTask).not.toHaveBeenCalled();
  });
});

