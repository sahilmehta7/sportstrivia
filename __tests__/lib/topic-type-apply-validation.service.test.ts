jest.mock("@/lib/services/background-task.service", () => ({
  getBackgroundTaskById: jest.fn(),
}));

import { BackgroundTaskStatus, BackgroundTaskType } from "@prisma/client";
import { getBackgroundTaskById } from "@/lib/services/background-task.service";
import { validateTopicTypeApplySelections } from "@/lib/services/topic-inference-task.service";

describe("validateTopicTypeApplySelections", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts selections that exactly match completed source audit suggestions", async () => {
    (getBackgroundTaskById as jest.Mock).mockResolvedValue({
      id: "audit_1",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
      status: BackgroundTaskStatus.COMPLETED,
      result: {
        rows: {
          typed: [
            {
              topicId: "topic_1",
              suggestedSchemaType: "SPORT",
            },
          ],
          untyped: [],
        },
      },
    });

    await expect(
      validateTopicTypeApplySelections({
        sourceTaskId: "audit_1",
        selections: [{ topicId: "topic_1", targetSchemaType: "SPORT" }],
        requestingUserId: "admin_1",
      })
    ).resolves.toEqual(
      expect.objectContaining({
        sourceTaskId: "audit_1",
      })
    );
  });

  it("rejects when source task is not completed", async () => {
    (getBackgroundTaskById as jest.Mock).mockResolvedValue({
      id: "audit_1",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
      status: BackgroundTaskStatus.IN_PROGRESS,
      result: {},
    });

    await expect(
      validateTopicTypeApplySelections({
        sourceTaskId: "audit_1",
        selections: [{ topicId: "topic_1", targetSchemaType: "SPORT" }],
        requestingUserId: "admin_1",
      })
    ).rejects.toThrow("completed topic type audit");
  });

  it("rejects when a selection is not present in source suggestions", async () => {
    (getBackgroundTaskById as jest.Mock).mockResolvedValue({
      id: "audit_1",
      userId: "admin_1",
      type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
      status: BackgroundTaskStatus.COMPLETED,
      result: {
        rows: {
          typed: [
            {
              topicId: "topic_1",
              suggestedSchemaType: "SPORT",
            },
          ],
          untyped: [],
        },
      },
    });

    await expect(
      validateTopicTypeApplySelections({
        sourceTaskId: "audit_1",
        selections: [{ topicId: "topic_1", targetSchemaType: "SPORTS_TEAM" }],
        requestingUserId: "admin_1",
      })
    ).rejects.toThrow("not present in source audit suggestions");
  });
});
