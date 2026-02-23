import { NextRequest } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, BadRequestError, successResponse } from "@/lib/errors";
import {
  createBackgroundTask,
  markBackgroundTaskCompleted,
  markBackgroundTaskFailed,
  markBackgroundTaskInProgress,
} from "@/lib/services/background-task.service";
import { restoreBackupFromBuffer, validateBackupBuffer } from "@/lib/services/backup-restore.service";

const REQUIRED_CONFIRMATION = "RESTORE DATABASE";

export const runtime = "nodejs";
export const maxDuration = 240;

export async function POST(request: NextRequest) {
  let taskId: string | null = null;

  try {
    const admin = await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    const confirmation = formData.get("confirmation");

    if (!(file instanceof File)) {
      throw new BadRequestError("Backup file is required");
    }

    if (typeof confirmation !== "string" || confirmation.trim() !== REQUIRED_CONFIRMATION) {
      throw new BadRequestError(`Confirmation phrase must be exactly "${REQUIRED_CONFIRMATION}"`);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const validation = validateBackupBuffer(bytes);
    if (!validation.valid) {
      return successResponse(validation, 400);
    }

    const task = await createBackgroundTask({
      userId: admin.id,
      type: BackgroundTaskType.BACKUP_RESTORE,
      label: `Backup restore • ${new Date().toISOString()}`,
      input: {
        backupVersion: validation.backupVersion ?? "unknown",
        createdAt: validation.createdAt ?? null,
      },
    });
    taskId = task.id;
    await markBackgroundTaskInProgress(task.id);

    const report = await restoreBackupFromBuffer({
      fileBuffer: bytes,
      actorId: admin.id,
    });

    if (!report.success) {
      await markBackgroundTaskFailed(task.id, report.errors.join("; "), report);
      return successResponse(report, 500);
    }

    await markBackgroundTaskCompleted(task.id, report);
    return successResponse(report);
  } catch (error) {
    if (taskId) {
      await markBackgroundTaskFailed(
        taskId,
        error instanceof Error ? error.message : "Restore failed"
      );
    }
    return handleError(error);
  }
}

