jest.mock("@/lib/db", () => ({
  prisma: {
    topic: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/services/background-task.service", () => ({
  getBackgroundTaskById: jest.fn(),
  markBackgroundTaskCompleted: jest.fn(),
  markBackgroundTaskFailed: jest.fn(),
  markBackgroundTaskInProgress: jest.fn(),
  updateTaskProgress: jest.fn(),
}));

jest.mock("@/lib/services/ai-openai-client.service", () => ({
  callOpenAIWithRetry: jest.fn(),
  extractContentFromCompletion: jest.fn(),
}));

jest.mock("@/lib/services/settings.service", () => ({
  getAIModel: jest.fn(),
}));

import { BackgroundTaskType } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getBackgroundTaskById,
  markBackgroundTaskCompleted,
} from "@/lib/services/background-task.service";
import {
  callOpenAIWithRetry,
  extractContentFromCompletion,
} from "@/lib/services/ai-openai-client.service";
import { getAIModel } from "@/lib/services/settings.service";
import { processTopicTypeAuditTask } from "@/lib/services/topic-inference-task.service";

describe("processTopicTypeAuditTask", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";

    (getBackgroundTaskById as jest.Mock).mockResolvedValue({
      id: "task_audit_1",
      type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
    });

    (prisma.topic.findMany as jest.Mock).mockResolvedValue([
      {
        id: "topic_1",
        name: "Football",
        slug: "football",
        schemaType: "SPORTS_TEAM",
        description: null,
        alternateNames: [],
        parentId: null,
        children: [],
        parent: null,
      },
      {
        id: "topic_2",
        name: "IPL",
        slug: "ipl",
        schemaType: "SPORTS_EVENT",
        description: null,
        alternateNames: [],
        parentId: null,
        children: [],
        parent: null,
      },
    ]);

    (getAIModel as jest.Mock).mockResolvedValue("gpt-4o-mini");
    (callOpenAIWithRetry as jest.Mock)
      .mockResolvedValueOnce({ id: "resp_1" })
      .mockResolvedValueOnce({ id: "resp_2" });
    (extractContentFromCompletion as jest.Mock)
      .mockReturnValueOnce("not-json")
      .mockReturnValueOnce(
        JSON.stringify({
          suggestedSchemaType: "SPORTS_EVENT",
          confidence: 0.9,
          rationale: "Looks like an event bucket.",
        })
      );
  });

  afterAll(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
  });

  it("captures malformed AI output per-row and still completes the run", async () => {
    await processTopicTypeAuditTask("task_audit_1");

    expect(markBackgroundTaskCompleted).toHaveBeenCalledWith(
      "task_audit_1",
      expect.objectContaining({
        rows: expect.objectContaining({
          typed: expect.arrayContaining([
            expect.objectContaining({
              topicId: "topic_1",
              suggestedSchemaType: null,
              confidence: null,
              rationale: expect.stringContaining("Classification failed"),
            }),
            expect.objectContaining({
              topicId: "topic_2",
              suggestedSchemaType: "SPORTS_EVENT",
              confidence: 0.9,
            }),
          ]),
        }),
      })
    );
  });
});
