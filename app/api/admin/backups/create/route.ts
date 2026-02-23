import { NextRequest, NextResponse } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError } from "@/lib/errors";
import { createEncryptedBackupSnapshot } from "@/lib/services/backup-export.service";
import {
  createBackgroundTask,
  markBackgroundTaskCompleted,
  markBackgroundTaskFailed,
  markBackgroundTaskInProgress,
} from "@/lib/services/background-task.service";
import { appendBackupAuditEvent } from "@/lib/services/restore-lock.service";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(_request: NextRequest) {
  let taskId: string | null = null;
  try {
    const admin = await requireAdmin();
    const task = await createBackgroundTask({
      userId: admin.id,
      type: BackgroundTaskType.BACKUP_CREATE,
      label: `Backup export • ${new Date().toISOString()}`,
      input: {},
    });
    taskId = task.id;

    await markBackgroundTaskInProgress(task.id);
    const snapshot = await createEncryptedBackupSnapshot();

    await markBackgroundTaskCompleted(task.id, {
      backupVersion: snapshot.manifest.backupVersion,
      createdAt: snapshot.manifest.createdAt,
      rowCounts: snapshot.manifest.rowCounts,
      storageTotalObjects: snapshot.manifest.storage.totalObjects,
      missingStorageObjects: snapshot.manifest.storage.missingObjects.length,
      checksum: snapshot.manifest.checksum,
    });

    await appendBackupAuditEvent({
      action: "BACKUP_CREATED",
      actorId: admin.id,
      context: {
        fileName: snapshot.fileName,
        checksum: snapshot.manifest.checksum,
        totalRows: Object.values(snapshot.manifest.rowCounts).reduce((acc, value) => acc + value, 0),
      },
    });

    return new NextResponse(new Uint8Array(snapshot.encryptedBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${snapshot.fileName}"`,
        "X-Backup-Version": snapshot.manifest.backupVersion,
        "X-Task-Id": task.id,
      },
    });
  } catch (error) {
    if (taskId) {
      await markBackgroundTaskFailed(
        taskId,
        error instanceof Error ? error.message : "Backup creation failed"
      );
    }
    return handleError(error);
  }
}
