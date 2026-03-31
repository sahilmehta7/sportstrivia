/** @jest-environment node */

jest.mock("next/server", () => ({
  after: jest.fn((callback: () => Promise<void> | void) => callback()),
  NextRequest: class {},
}));

var prismaMock: {
  $transaction: jest.Mock;
  $queryRaw: jest.Mock;
  $queryRawUnsafe: jest.Mock;
  adminBackgroundTask: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  backupUploadSession: {
    updateMany: jest.Mock;
    findUnique: jest.Mock;
  };
  user: {
    count: jest.Mock;
  };
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    adminBackgroundTask: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    backupUploadSession: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/services/backup-upload-session.service", () => ({
  getBackupBufferForSession: jest.fn(),
  getOwnedBackupUploadSessionOrThrow: jest.fn(),
  markBackupUploadSessionValidated: jest.fn(),
}));

jest.mock("@/lib/services/backup-restore.service", () => ({
  validateBackupBuffer: jest.fn(),
}));

jest.mock("@/lib/services/backup-restore-task-processor.service", () => ({
  processBackupRestoreTask: jest.fn(),
}));

import { requireAdmin } from "@/lib/auth-helpers";
import { BackgroundTaskType } from "@prisma/client";
import { BACKUP_VERSION } from "@/lib/backup/types";
import {
  getBackupBufferForSession,
  getOwnedBackupUploadSessionOrThrow,
  markBackupUploadSessionValidated,
} from "@/lib/services/backup-upload-session.service";
import { validateBackupBuffer } from "@/lib/services/backup-restore.service";
import { processBackupRestoreTask } from "@/lib/services/backup-restore-task-processor.service";
import { POST as validatePOST } from "@/app/api/admin/backups/validate/route";
import { POST as restorePOST } from "@/app/api/admin/backups/restore/route";

describe("backup validate/restore routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1", role: "ADMIN" });
    prismaMock.adminBackgroundTask.findFirst.mockResolvedValue(null);
    prismaMock.adminBackgroundTask.create.mockResolvedValue({
      id: "task_1",
      type: BackgroundTaskType.BACKUP_RESTORE,
      attempt: 1,
    });
    prismaMock.adminBackgroundTask.update.mockResolvedValue({
      id: "task_1",
      userId: "admin_1",
    });
    prismaMock.backupUploadSession.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.backupUploadSession.findUnique.mockResolvedValue({ status: "VALIDATED" });
    prismaMock.user.count.mockResolvedValue(1);
    prismaMock.$queryRaw.mockResolvedValue([{ locked: true }]);
    prismaMock.$queryRawUnsafe.mockResolvedValue([
      { value: "BACKUP_RESTORE" },
      { value: "AI_QUIZ_IMPORT" },
    ]);
    prismaMock.$transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => callback(prismaMock));
    (getOwnedBackupUploadSessionOrThrow as jest.Mock).mockResolvedValue({
      id: "session_1",
      status: "VALIDATED",
    });
  });

  it("validates a backup from uploadSessionId", async () => {
    (getBackupBufferForSession as jest.Mock).mockResolvedValue({
      bytes: Buffer.from("encrypted"),
      session: { id: "session_1" },
    });
    (validateBackupBuffer as jest.Mock).mockReturnValue({
      valid: true,
      backupVersion: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      warnings: [],
      errors: [],
    });

    const request = new Request("http://localhost/api/admin/backups/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadSessionId: "session_1" }),
    });

    const response = await validatePOST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.valid).toBe(true);
    expect(getBackupBufferForSession).toHaveBeenCalledWith("session_1", "admin_1");
    expect(markBackupUploadSessionValidated).toHaveBeenCalledWith("session_1");
  });

  it("enqueues restore and processes it in after callback", async () => {
    (processBackupRestoreTask as jest.Mock).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/admin/backups/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadSessionId: "session_1",
        confirmation: "RESTORE DATABASE",
      }),
    });

    const response = await restorePOST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.taskId).toBe("task_1");
    expect(getOwnedBackupUploadSessionOrThrow).toHaveBeenCalledWith("session_1", "admin_1");
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.user.count).toHaveBeenCalledWith({ where: { id: "admin_1" } });
    expect(processBackupRestoreTask).toHaveBeenCalledWith({
      taskId: "task_1",
      uploadSessionId: "session_1",
      actorId: "admin_1",
    });
  });

  it("rejects restore when session is not validated", async () => {
    (getOwnedBackupUploadSessionOrThrow as jest.Mock).mockResolvedValue({
      id: "session_1",
      status: "UPLOADED",
    });

    const request = new Request("http://localhost/api/admin/backups/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadSessionId: "session_1",
        confirmation: "RESTORE DATABASE",
      }),
    });

    const response = await restorePOST(request as any);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/must be validated/i);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns 409 when another restore task is active", async () => {
    prismaMock.adminBackgroundTask.findFirst.mockResolvedValueOnce({ id: "task_existing" });

    const request = new Request("http://localhost/api/admin/backups/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadSessionId: "session_1",
        confirmation: "RESTORE DATABASE",
      }),
    });

    const response = await restorePOST(request as any);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.data.taskId).toBe("task_existing");
    expect(processBackupRestoreTask).not.toHaveBeenCalled();
  });

  it("returns 503 when enqueue lock is busy and no active task is found", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ locked: false }]);
    prismaMock.adminBackgroundTask.findFirst.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/admin/backups/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadSessionId: "session_1",
        confirmation: "RESTORE DATABASE",
      }),
    });

    const response = await restorePOST(request as any);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.code).toBe("BACKUP_RESTORE_ENQUEUE_BUSY");
    expect(processBackupRestoreTask).not.toHaveBeenCalled();
  });
});
