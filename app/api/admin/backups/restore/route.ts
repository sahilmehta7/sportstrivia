import { NextRequest, after } from "next/server";
import { BackgroundTaskStatus, BackgroundTaskType, BackupUploadSessionStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, AppError, BadRequestError, successResponse } from "@/lib/errors";
import { prisma } from "@/lib/db";
import {
  assertBackgroundTaskTypesSupported,
  createBackgroundTaskWithClient,
} from "@/lib/services/background-task.service";
import { processBackupRestoreTask } from "@/lib/services/backup-restore-task-processor.service";
import { getOwnedBackupUploadSessionOrThrow } from "@/lib/services/backup-upload-session.service";

const REQUIRED_CONFIRMATION = "RESTORE DATABASE";
const RESTORE_ENQUEUE_ADVISORY_LOCK_KEY = 984_447_321;

export const runtime = "nodejs";
export const maxDuration = 10;

const restoreSchema = z.object({
  uploadSessionId: z.string().min(1),
  confirmation: z.string().optional(),
});

function buildInvalidSessionStateError(status: BackupUploadSessionStatus | undefined): AppError {
  switch (status) {
    case BackupUploadSessionStatus.PENDING_UPLOAD:
    case BackupUploadSessionStatus.UPLOADED:
      return new AppError(409, "Backup must be validated before restore", "BACKUP_RESTORE_REQUIRES_VALIDATION");
    case BackupUploadSessionStatus.RESTORE_IN_PROGRESS:
      return new AppError(409, "Backup restore is already in progress for this upload", "BACKUP_RESTORE_ALREADY_RUNNING");
    case BackupUploadSessionStatus.RESTORED:
      return new AppError(409, "Backup upload session was already restored", "BACKUP_RESTORE_ALREADY_COMPLETED");
    case BackupUploadSessionStatus.FAILED:
      return new AppError(422, "Backup upload session is in failed state and cannot be restored", "BACKUP_RESTORE_INVALID_SESSION_STATE");
    case BackupUploadSessionStatus.EXPIRED:
      return new AppError(410, "Backup upload session expired", "BACKUP_UPLOAD_EXPIRED");
    default:
      return new AppError(422, "Backup upload session is not eligible for restore", "BACKUP_RESTORE_INVALID_SESSION_STATE");
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = restoreSchema.parse(await request.json().catch(() => ({})));
    const confirmation = body.confirmation ?? request.headers.get("X-Restore-Confirmation");

    if (typeof confirmation !== "string" || confirmation.trim() !== REQUIRED_CONFIRMATION) {
      throw new BadRequestError(`Confirmation phrase must be exactly "${REQUIRED_CONFIRMATION}"`);
    }

    const session = await getOwnedBackupUploadSessionOrThrow(body.uploadSessionId, admin.id);
    if (session.status !== BackupUploadSessionStatus.VALIDATED) {
      throw buildInvalidSessionStateError(session.status);
    }
    await assertBackgroundTaskTypesSupported([BackgroundTaskType.BACKUP_RESTORE]);

    const queueResult = await prisma.$transaction(async (tx) => {
      const lockRows = await tx.$queryRaw<Array<{ locked: boolean }>>`
        SELECT pg_try_advisory_xact_lock(${RESTORE_ENQUEUE_ADVISORY_LOCK_KEY}) AS locked
      `;
      const hasLock = Boolean(lockRows[0]?.locked);
      if (!hasLock) {
        const lockHolder = await tx.adminBackgroundTask.findFirst({
          where: {
            type: BackgroundTaskType.BACKUP_RESTORE,
            status: {
              in: [BackgroundTaskStatus.PENDING, BackgroundTaskStatus.IN_PROGRESS],
            },
          },
          select: { id: true },
        });
        if (lockHolder?.id) {
          return { conflictTaskId: lockHolder.id };
        }
        return { retryableLockContention: true as const };
      }

      const activeRestore = await tx.adminBackgroundTask.findFirst({
        where: {
          type: BackgroundTaskType.BACKUP_RESTORE,
          status: {
            in: [BackgroundTaskStatus.PENDING, BackgroundTaskStatus.IN_PROGRESS],
          },
        },
        select: { id: true },
      });
      if (activeRestore) {
        return { conflictTaskId: activeRestore.id };
      }

      const task = await createBackgroundTaskWithClient(tx as any, {
        userId: null,
        type: BackgroundTaskType.BACKUP_RESTORE,
        status: BackgroundTaskStatus.PENDING,
        label: `Backup restore • ${new Date().toISOString()}`,
        input: {
          uploadSessionId: body.uploadSessionId,
        },
      });

      if (admin.id) {
        const userExists = await tx.user.count({
          where: { id: admin.id },
        });
        if (userExists > 0) {
          await tx.adminBackgroundTask.update({
            where: { id: task.id },
            data: { userId: admin.id },
          });
        }
      }

      const claimedSession = await tx.backupUploadSession.updateMany({
        where: {
          id: body.uploadSessionId,
          actorId: admin.id,
          deletedAt: null,
          expiresAt: { gt: new Date() },
          status: BackupUploadSessionStatus.VALIDATED,
        },
        data: {
          status: BackupUploadSessionStatus.RESTORE_IN_PROGRESS,
          taskId: task.id,
          lastError: null,
        },
      });

      if (claimedSession.count === 0) {
        const currentSession = await tx.backupUploadSession.findUnique({
          where: { id: body.uploadSessionId },
          select: { status: true },
        });
        throw buildInvalidSessionStateError(currentSession?.status);
      }

      return { taskId: task.id, attempt: task.attempt ?? 1 };
    });

    if ("conflictTaskId" in queueResult) {
      return successResponse(
        {
          taskId: queueResult.conflictTaskId,
          status: "processing",
          message: "A backup restore is already in progress.",
        },
        409
      );
    }
    if ("retryableLockContention" in queueResult) {
      throw new AppError(
        503,
        "Restore enqueue is temporarily busy. Please retry in a few seconds.",
        "BACKUP_RESTORE_ENQUEUE_BUSY"
      );
    }

    after(async () => {
      try {
        await processBackupRestoreTask({
          taskId: queueResult.taskId,
          uploadSessionId: body.uploadSessionId,
          actorId: admin.id,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Backup Restore] after() callback failed", {
          taskId: queueResult.taskId,
          message,
        });
      }
    });

    return successResponse({
      taskId: queueResult.taskId,
      attempt: queueResult.attempt,
      status: "processing",
      message: "Backup restore enqueued. Track progress in Admin AI Tasks.",
    });
  } catch (error) {
    return handleError(error);
  }
}
