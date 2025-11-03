// Mock next/server - must be before importing the route
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

import { POST } from "@/app/api/admin/ai/generate-quiz/process/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn().mockResolvedValue({ id: "admin_123", role: "ADMIN" }),
}));

jest.mock("@/lib/services/ai-quiz-processor.service", () => ({
  processAIQuizTask: jest.fn(),
}));

const { requireAdmin } = require("@/lib/auth-helpers");
const { processAIQuizTask } = require("@/lib/services/ai-quiz-processor.service");

describe("/api/admin/ai/generate-quiz/process", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    processAIQuizTask.mockResolvedValue(undefined);
  });

  const createMockRequest = (body: any, isInternalCall = false) => ({
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn((name: string) => {
        if (name === "x-internal-call") {
          return isInternalCall ? "true" : null;
        }
        return null;
      }),
    },
  } as any);

  it("should process task with admin authentication", async () => {
    const req = createMockRequest({ taskId: "task_123" });

    const response = await POST(req);
    const json = await (response as any).json();

    expect(requireAdmin).toHaveBeenCalled();
    expect(processAIQuizTask).toHaveBeenCalledWith("task_123");
    expect(json.data.taskId).toBe("task_123");
    expect(json.data.status).toBe("completed");
  });

  it("should skip auth for internal calls", async () => {
    const req = createMockRequest({ taskId: "task_123" }, true);

    const response = await POST(req);
    const json = await (response as any).json();

    expect(requireAdmin).not.toHaveBeenCalled();
    expect(processAIQuizTask).toHaveBeenCalledWith("task_123");
    expect(json.data.status).toBe("completed");
  });

  it("should return error if taskId is missing", async () => {
    const req = createMockRequest({});

    const response = await POST(req);
    const json = await (response as any).json();

    expect(json.error).toContain("taskId is required");
    expect(processAIQuizTask).not.toHaveBeenCalled();
  });

  it("should handle processing errors", async () => {
    processAIQuizTask.mockRejectedValue(new Error("Processing failed"));

    const req = createMockRequest({ taskId: "task_123" });

    const response = await POST(req);
    const json = await (response as any).json();

    expect(json.error).toBeDefined();
    expect(processAIQuizTask).toHaveBeenCalledWith("task_123");
  });
});

