"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import {
    cancelBackgroundTask,
    getOwnedBackgroundTaskOrThrow,
    restartBackgroundTask,
} from "@/lib/services/background-task.service";

export async function retryTask(taskId: string) {
    const admin = await requireAdmin();
    const task = await getOwnedBackgroundTaskOrThrow(taskId, admin.id);
    const restarted = await restartBackgroundTask(taskId);

    // Re-trigger/Retry Background Task directly
    const finalTaskId = taskId; // Capture for closure

    if (task.type === BackgroundTaskType.AI_QUIZ_GENERATION) {
        after(async () => {
            const { processAIQuizTask } = await import("@/lib/services/ai-quiz-processor.service");
            await processAIQuizTask(finalTaskId);
        });
    } else if (task.type === BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION) {
        after(async () => {
            const { processAIQuestionsTask } = await import("@/lib/services/ai-questions-processor.service");
            await processAIQuestionsTask(finalTaskId);
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
    const admin = await requireAdmin();
    const task = await getOwnedBackgroundTaskOrThrow(taskId, admin.id);
    const cancelled = await cancelBackgroundTask(task.id, (task as any).attempt ?? 1);

    revalidatePath("/admin/ai-tasks");
    return {
        taskId,
        attempt: (task as any).attempt ?? 1,
        status: cancelled?.status ?? task.status,
    };
}
