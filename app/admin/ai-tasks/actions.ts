"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { BackgroundTaskStatus, BackgroundTaskType } from "@prisma/client";

export async function retryTask(taskId: string) {
    await requireAdmin();

    const task = await prisma.adminBackgroundTask.findUnique({
        where: { id: taskId },
    });

    if (!task) {
        throw new Error("Task not found");
    }

    // Update status to pending
    await prisma.adminBackgroundTask.update({
        where: { id: taskId },
        data: {
            status: BackgroundTaskStatus.PENDING,
            errorMessage: null, // Clear error
            startedAt: null,
            completedAt: null,
        },
    });

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
}

export async function cancelTask(taskId: string) {
    await requireAdmin();

    // For now, we only mark as cancelled in DB
    // Inngest cancellation would require the runId which we ideally should store
    await prisma.adminBackgroundTask.update({
        where: { id: taskId },
        data: {
            status: BackgroundTaskStatus.CANCELLED,
            errorMessage: "Cancelled by user",
            completedAt: new Date(),
        },
    });

    revalidatePath("/admin/ai-tasks");
}
