jest.mock("@/lib/db", () => ({
  prisma: {
    $queryRawUnsafe: jest.fn(),
    adminBackgroundTask: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { BackgroundTaskType } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  assertBackgroundTaskTypesSupported,
  countBackgroundTasksForUser,
  createBackgroundTask,
  createBackgroundTaskWithClient,
  getAdminBackgroundTaskOrThrow,
  getOwnedBackgroundTaskOrThrow,
  listBackgroundTasksForUser,
} from "@/lib/services/background-task.service";
import { NotFoundError, ServiceUnavailableError } from "@/lib/errors";

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

  it("retries with null userId when AdminBackgroundTask user FK is violated", async () => {
    (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([
      { value: "AI_QUIZ_GENERATION" },
    ]);
    (prisma.adminBackgroundTask.create as jest.Mock)
      .mockRejectedValueOnce({
        code: "P2003",
        meta: { field_name: "AdminBackgroundTask_userId_fkey" },
      })
      .mockResolvedValueOnce({
        id: "task_2",
        type: BackgroundTaskType.AI_QUIZ_GENERATION,
        status: "PENDING",
        label: "AI quiz",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const task = await createBackgroundTask({
      userId: "missing_admin_user",
      type: BackgroundTaskType.AI_QUIZ_GENERATION,
      label: "AI quiz",
      input: {},
    });

    expect(task.id).toBe("task_2");
    expect(prisma.adminBackgroundTask.create).toHaveBeenCalledTimes(2);
    expect((prisma.adminBackgroundTask.create as jest.Mock).mock.calls[1][0].data.userId).toBeNull();
  });

  it("includes null-owned tasks in user-scoped admin task listing", async () => {
    (prisma.adminBackgroundTask.findMany as jest.Mock).mockResolvedValue([]);

    await listBackgroundTasksForUser("admin_1");

    expect(prisma.adminBackgroundTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ userId: "admin_1" }, { userId: null }],
        }),
      })
    );
  });

  it("uses identical user scope predicates for list and count", async () => {
    (prisma.adminBackgroundTask.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.adminBackgroundTask.count as jest.Mock).mockResolvedValue(0);

    await listBackgroundTasksForUser("admin_1", {
      types: [BackgroundTaskType.BACKUP_RESTORE],
    });
    await countBackgroundTasksForUser("admin_1", {
      types: [BackgroundTaskType.BACKUP_RESTORE],
    });

    expect((prisma.adminBackgroundTask.findMany as jest.Mock).mock.calls[0][0].where).toEqual(
      (prisma.adminBackgroundTask.count as jest.Mock).mock.calls[0][0].where
    );
  });

  it("allows admin-safe fetch regardless of task ownership", async () => {
    (prisma.adminBackgroundTask.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "task_foreign",
      userId: "some_other_admin",
    });
    (prisma.adminBackgroundTask.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "task_null_owner",
      userId: null,
    });

    const foreign = await getAdminBackgroundTaskOrThrow("task_foreign");
    const nullOwned = await getAdminBackgroundTaskOrThrow("task_null_owner");

    expect(foreign.id).toBe("task_foreign");
    expect(nullOwned.id).toBe("task_null_owner");
  });

  it("keeps owner-checked accessor strict for non-admin contexts", async () => {
    (prisma.adminBackgroundTask.findUnique as jest.Mock).mockResolvedValue({
      id: "task_3",
      userId: "different_admin",
    });

    await expect(getOwnedBackgroundTaskOrThrow("task_3", "admin_1")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("fails fast for backup task types when enum support is missing", async () => {
    const baseNow = Date.now();
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(baseNow + 120_000);
    (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValueOnce([{ value: "AI_QUIZ_IMPORT" }]);

    const tx = {
      adminBackgroundTask: {
        create: jest.fn().mockResolvedValue({
          id: "task_tx_1",
          type: BackgroundTaskType.AI_QUIZ_IMPORT,
          status: "PENDING",
          label: "Backup restore",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    };

    await expect(
      createBackgroundTaskWithClient(tx as any, {
        userId: null,
        type: BackgroundTaskType.BACKUP_RESTORE,
        label: "Backup restore",
        input: { uploadSessionId: "session_1" },
      })
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
    nowSpy.mockRestore();

    expect(tx.adminBackgroundTask.create).not.toHaveBeenCalled();
  });

  it("asserts backup enum support explicitly", async () => {
    (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([{ value: "AI_QUIZ_IMPORT" }]);

    await expect(
      assertBackgroundTaskTypesSupported([BackgroundTaskType.BACKUP_CREATE])
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});
