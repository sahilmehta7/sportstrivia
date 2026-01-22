import { inngest } from "@/lib/inngest/client";
import { processAIQuizTask } from "@/lib/services/ai-quiz-processor.service";
import { markBackgroundTaskFailed, markBackgroundTaskInProgress, updateBackgroundTask } from "@/lib/services/background-task.service";

export const generateQuiz = inngest.createFunction(
    { id: "generate-quiz" },
    { event: "ai/quiz.generate" },
    async ({ event, step }) => {
        const { taskId } = event.data;

        if (!taskId) {
            return { error: "No taskId provided" };
        }

        try {
            // Step 1: Mark as in progress
            await step.run("mark-in-progress", async () => {
                await markBackgroundTaskInProgress(taskId);
            });

            // Step 2: Process the quiz generation
            // Note: processAIQuizTask handles its own detailed status updates and completion marking
            // We wrap it in step.run to ensure retries work at this level if the function crashes
            await step.run("process-quiz", async () => {
                await processAIQuizTask(taskId);
            });

            return { taskId, status: "completed" };

        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error in background job";

            // Final fallback error handling
            await step.run("mark-failed", async () => {
                try {
                    await markBackgroundTaskFailed(taskId, message);
                } catch (e) {
                    console.error("Failed to mark task as failed:", e);
                }
            });

            throw error; // Re-throw to trigger Inngest retry policy (if configured)
        }
    }
);
