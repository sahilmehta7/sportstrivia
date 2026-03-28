jest.mock("@/lib/db", () => ({
  prisma: {
    $queryRawUnsafe: jest.fn(),
    adminBackgroundTask: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { BackgroundTaskType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createBackgroundTask } from "@/lib/services/background-task.service";
import { ServiceUnavailableError } from "@/lib/errors";

describe("background task service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.adminBackgroundTask.create as jest.Mock).mockResolvedValue({
      id: "task_1",
      type: BackgroundTaskType.TOPIC_RELATION_INFERENCE,
      status: "PENDING",
      label: "x",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("fails fast when TOPIC_TYPE_APPLY is missing from DB enum values", async () => {
    (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([
      { value: "TOPIC_TYPE_AUDIT" },
      { value: "TOPIC_RELATION_INFERENCE" },
    ]);

    await expect(
      createBackgroundTask({
        userId: "admin_1",
        type: BackgroundTaskType.TOPIC_TYPE_APPLY,
        label: "Topic type apply",
        input: {},
      })
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(prisma.adminBackgroundTask.create).not.toHaveBeenCalled();
  });

  it("fails fast when DB enum verification fails for TOPIC_TYPE_APPLY", async () => {
    (prisma.$queryRawUnsafe as jest.Mock).mockRejectedValue(new Error("db unavailable"));

    await expect(
      createBackgroundTask({
        userId: "admin_1",
        type: BackgroundTaskType.TOPIC_TYPE_APPLY,
        label: "Topic type apply",
        input: {},
      })
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(prisma.adminBackgroundTask.create).not.toHaveBeenCalled();
  });
});
