import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError, NotFoundError } from "@/lib/errors";
import { z } from "zod";
import { getAIModel, getAIQuizPrompt } from "@/lib/services/settings.service";
import {
  createBackgroundTask,
  markBackgroundTaskCompleted,
  markBackgroundTaskFailed,
  markBackgroundTaskInProgress,
  updateBackgroundTask,
} from "@/lib/services/background-task.service";
import { BackgroundTaskType } from "@prisma/client";
import {
  callOpenAIWithRetry,
  extractContentFromCompletion,
  extractUsageStats,
} from "@/lib/services/ai-openai-client.service";
import { extractJSON } from "@/lib/services/ai-quiz-processor.service";
import { inngest } from "@/lib/inngest/client";

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
  let taskId: string | null = null;
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
    const baseTemplate = await getAIQuizPrompt();

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
    taskId = backgroundTask.id;

    // Offload to Inngest for durable execution
    await inngest.send({
      name: "ai/questions.generate",
      data: {
        taskId,
        topicId: id,
        easyCount,
        mediumCount,
        hardCount
      }
    });

    return successResponse({
      taskId,
      status: "processing",
      message: "Question generation started via Inngest.",
    });
  } catch (error) {
    if (taskId) {
      const message = error instanceof Error ? error.message : "Unknown error";
      try {
        await markBackgroundTaskFailed(taskId, message);
      } catch {
        // Silently handle task status update errors
      }
    }
    return handleError(error);
  }
}

function buildQuestionsOnlyPrompt(
  baseTemplate: string,
  topicName: string,
  sport: string,
  total: number,
  slug: string,
  counts: { easyCount: number; mediumCount: number; hardCount: number }
): string {
  // Start from the editable template to keep admin control, but pivot to questions-only output
  const scaffold = baseTemplate
    .replace(/\{\{TOPIC\}\}/g, topicName)
    .replace(/\{\{TOPIC_LOWER\}\}/g, topicName.toLowerCase())
    .replace(/\{\{SLUGIFIED_TOPIC\}\}/g, slug)
    .replace(/\{\{SPORT\}\}/g, sport)
    .replace(/\{\{DIFFICULTY\}\}/g, "MEDIUM")
    .replace(/\{\{NUM_QUESTIONS\}\}/g, String(total))
    .replace(/\{\{DURATION\}\}/g, String(total * 60));

  const mixNote = `Generate exactly ${counts.easyCount} EASY, ${counts.mediumCount} MEDIUM, and ${counts.hardCount} HARD questions.`;

  // Override structure to ONLY output an object with a questions array in the expected format
  return `You are generating questions only. Ignore any quiz-level fields in previous instructions.

Return strictly valid JSON matching this shape and nothing else:
{
  "questions": [
    {
      "questionText": "",
      "difficulty": "EASY|MEDIUM|HARD",
      "hint": "",
      "explanation": "",
      "answers": [
        { "answerText": "", "isCorrect": true },
        { "answerText": "", "isCorrect": false },
        { "answerText": "", "isCorrect": false },
        { "answerText": "", "isCorrect": false }
      ]
    }
  ]
}

Topic: ${topicName}
${mixNote}
All questions must be unique, unambiguous, and about the topic. Ensure factual accuracy. Keep hints short and helpful. Explanations should be 1–2 concise sentences. Only one answer can be correct. Output JSON only.

Context (for your reference):\n\n"""\n${scaffold.substring(0, 1200)}\n"""`;
}
