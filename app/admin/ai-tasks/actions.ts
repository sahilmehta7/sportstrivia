"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import {
    cancelBackgroundTask,
    getAdminBackgroundTaskOrThrow,
    restartBackgroundTask,
} from "@/lib/services/background-task.service";

export async function retryTask(taskId: string) {
    const admin = await requireAdmin();
    const task = await getAdminBackgroundTaskOrThrow(taskId);
    const restarted = await restartBackgroundTask(taskId);

    // Re-trigger/Retry Background Task directly
    const finalTaskId = taskId; // Capture for closure

    if (task.type === BackgroundTaskType.AI_QUIZ_GENERATION) {
        after(async () => {
            try {
                const { processAIQuizTask } = await import("@/lib/services/ai-quiz-processor.service");
                await processAIQuizTask(finalTaskId);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error("[AI Task] after() callback failed", {
                    taskId: finalTaskId,
                    taskType: BackgroundTaskType.AI_QUIZ_GENERATION,
                    attempt: (restarted as any).attempt ?? 1,
                    message,
                });
            }
        });
    } else if (task.type === BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION) {
        after(async () => {
            try {
                const { processAIQuestionsTask } = await import("@/lib/services/ai-questions-processor.service");
                await processAIQuestionsTask(finalTaskId);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error("[AI Task] after() callback failed", {
                    taskId: finalTaskId,
                    taskType: BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION,
                    attempt: (restarted as any).attempt ?? 1,
                    message,
                });
            }
        });
    } else if (task.type === BackgroundTaskType.BACKUP_RESTORE) {
        const input = (restarted.input ?? task.input ?? {}) as { uploadSessionId?: string };
        if (!input.uploadSessionId) {
            throw new Error("Cannot retry restore task: missing uploadSessionId in task input");
        }

        after(async () => {
            try {
                const { processBackupRestoreTask } = await import("@/lib/services/backup-restore-task-processor.service");
                await processBackupRestoreTask({
                    taskId: finalTaskId,
                    uploadSessionId: input.uploadSessionId as string,
                    actorId: admin.id,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error("[AI Task] after() callback failed", {
                    taskId: finalTaskId,
                    taskType: BackgroundTaskType.BACKUP_RESTORE,
                    attempt: (restarted as any).attempt ?? 1,
                    message,
                });
            }
        });
    } else {
        throw new Error("Retry not implemented for this task type");
    }

    revalidatePath("/admin/ai-tasks");
    return {
        taskId: finalTaskId,
        attempt: (restarted as any).attempt ?? 1,
        status: restarted.status,
    };
}

export async function cancelTask(taskId: string) {
    await requireAdmin();
    const task = await getAdminBackgroundTaskOrThrow(taskId);
    const cancelled = await cancelBackgroundTask(task.id, (task as any).attempt ?? 1);

    revalidatePath("/admin/ai-tasks");
    return {
        taskId,
        attempt: (task as any).attempt ?? 1,
        status: cancelled?.status ?? task.status,
    };
}
