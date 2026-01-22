"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { revalidatePath } from "next/cache";
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

    // Re-trigger Inngest Event based on type
    if (task.type === BackgroundTaskType.AI_QUIZ_GENERATION) {
        const input = task.input as any;
        await inngest.send({
            name: "ai/quiz.generate",
            data: {
                taskId: task.id,
                input: input // Pass original input back
            }
        });
    } else if (task.type === BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION) {
        const input = task.input as any;
        await inngest.send({
            name: "ai/questions.generate",
            data: {
                taskId: task.id,
                topicId: input.topicId,
                easyCount: input.easyCount,
                mediumCount: input.mediumCount,
                hardCount: input.hardCount
            }
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
