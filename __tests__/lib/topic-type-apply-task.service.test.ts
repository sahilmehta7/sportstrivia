jest.mock("@/lib/db", () => ({
  prisma: {
    topic: {
      findUnique: jest.fn(),
      update: jest.fn(),
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

jest.mock("@/lib/topic-graph/topic-readiness.persistence", () => ({
  syncTopicEntityReadiness: jest.fn(),
}));

import { BackgroundTaskType } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getBackgroundTaskById,
  markBackgroundTaskCompleted,
} from "@/lib/services/background-task.service";
import { syncTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.persistence";
import { processTopicTypeApplyTask } from "@/lib/services/topic-inference-task.service";

describe("processTopicTypeApplyTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getBackgroundTaskById as jest.Mock)
      .mockResolvedValueOnce({
        id: "task_apply_1",
        type: BackgroundTaskType.TOPIC_TYPE_APPLY,
        userId: "admin_1",
        input: {
          sourceTaskId: "audit_1",
          selections: [
            { topicId: "topic_1", targetSchemaType: "SPORT" },
            { topicId: "topic_2", targetSchemaType: "SPORTS_EVENT" },
          ],
        },
      })
      .mockResolvedValueOnce({
        id: "audit_1",
        userId: "admin_1",
        type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
        status: "COMPLETED",
        result: {
          rows: {
            typed: [
              { topicId: "topic_1", suggestedSchemaType: "SPORT" },
              { topicId: "topic_2", suggestedSchemaType: "SPORTS_EVENT" },
            ],
            untyped: [],
          },
        },
      });
    (prisma.topic.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "topic_1", schemaType: "SPORTS_TEAM" })
      .mockResolvedValueOnce({ id: "topic_2", schemaType: "SPORTS_EVENT" });
    (prisma.topic.update as jest.Mock).mockResolvedValue({ id: "topic_1" });
    (syncTopicEntityReadiness as jest.Mock).mockResolvedValue({ entityStatus: "READY" });
  });

  it("updates only changed selected topics and records before/after values", async () => {
    await processTopicTypeApplyTask("task_apply_1");

    expect(prisma.topic.update).toHaveBeenCalledTimes(1);
    expect(prisma.topic.update).toHaveBeenCalledWith({
      where: { id: "topic_1" },
      data: { schemaType: "SPORT" },
    });
    expect(syncTopicEntityReadiness).toHaveBeenCalledWith("topic_1");
    expect(markBackgroundTaskCompleted).toHaveBeenCalledWith(
      "task_apply_1",
      expect.objectContaining({
        summary: expect.objectContaining({
          selectedCount: 2,
          appliedCount: 1,
          skippedCount: 1,
        }),
        appliedRows: [
          {
            topicId: "topic_1",
            previousSchemaType: "SPORTS_TEAM",
            targetSchemaType: "SPORT",
          },
        ],
      })
    );
  });
});
