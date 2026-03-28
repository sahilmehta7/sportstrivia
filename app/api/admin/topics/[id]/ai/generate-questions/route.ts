import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError, NotFoundError } from "@/lib/errors";
import { z } from "zod";
import { getAIModel } from "@/lib/services/settings.service";
import { createBackgroundTask } from "@/lib/services/background-task.service";
import { BackgroundTaskType } from "@prisma/client";
import { processAIQuestionsTask } from "@/lib/services/ai-questions-processor.service";
import { after } from "next/server";

// Use Node.js runtime for long-running AI operations
export const runtime = 'nodejs';

// Increase route timeout for AI generation
export const maxDuration = 60;

const generationSchema = z
  .object({
    easyCount: z.number().int().min(0).max(50).default(0),
    mediumCount: z.number().int().min(0).max(50).default(0),
    hardCount: z.number().int().min(0).max(50).default(0),
  })
  .refine((v) => (v.easyCount + v.mediumCount + v.hardCount) > 0, {
    message: "Provide at least one question to generate",
    path: ["easyCount"],
  });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();

    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestError("OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.");
    }

    const { id } = await params;

    const body = await request.json();
    const { easyCount, mediumCount, hardCount } = generationSchema.parse(body);

    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      throw new NotFoundError("Topic not found");
    }

    const total = easyCount + mediumCount + hardCount;
    const aiModel = await getAIModel();

    const backgroundTask = await createBackgroundTask({
      userId: admin.id,
      type: BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION,
      label: `AI Questions • ${topic.name}`,
      input: {
        topicId: id,
        topicName: topic.name,
        easyCount,
        mediumCount,
        hardCount,
        total,
        model: aiModel,
      },
    });

    // Start processing in background without Inngest
    const finalTaskId = backgroundTask.id;
    after(async () => {
      try {
        await processAIQuestionsTask(finalTaskId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[AI Task] after() callback failed", {
          taskId: finalTaskId,
          taskType: BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION,
          message,
        });
      }
    });

    return successResponse({
      taskId: backgroundTask.id,
      attempt: (backgroundTask as any).attempt ?? 1,
      status: "processing",
      message: "Question generation started via Inngest.",
    });
  } catch (error) {
    return handleError(error);
  }
}
