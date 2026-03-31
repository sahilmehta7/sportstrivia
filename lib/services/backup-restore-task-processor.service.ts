import {
  getBackupBufferForSession,
  markBackupUploadSessionFailed,
  markBackupUploadSessionRestoredAndDelete,
} from "@/lib/services/backup-upload-session.service";
import {
  markBackgroundTaskCompleted,
  markBackgroundTaskFailed,
  markBackgroundTaskInProgress,
} from "@/lib/services/background-task.service";
import { restoreBackupFromBuffer } from "@/lib/services/backup-restore.service";

export async function processBackupRestoreTask(input: {
  taskId: string;
  uploadSessionId: string;
  actorId: string;
}): Promise<void> {
  const startedTask = await markBackgroundTaskInProgress(input.taskId);
  if (!startedTask) {
    return;
  }

  const attempt = (startedTask as any).attempt ?? 1;

  try {
    const { bytes } = await getBackupBufferForSession(input.uploadSessionId, input.actorId);

    const report = await restoreBackupFromBuffer({
      fileBuffer: bytes,
      actorId: input.actorId,
    });

    if (!report.success) {
      const message = report.errors.join("; ") || "Backup restore failed";
      await markBackgroundTaskFailed(input.taskId, message, report, attempt);
      await markBackupUploadSessionFailed(input.uploadSessionId, message);
      return;
    }

    await markBackgroundTaskCompleted(input.taskId, report, attempt);
    await markBackupUploadSessionRestoredAndDelete(input.uploadSessionId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restore task failed";
    await markBackgroundTaskFailed(input.taskId, message, undefined, attempt);
    await markBackupUploadSessionFailed(input.uploadSessionId, message);
  }
}
