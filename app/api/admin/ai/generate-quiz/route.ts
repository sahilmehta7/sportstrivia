import { NextRequest } from "next/server";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import {
  createBackgroundTask,
  markBackgroundTaskFailed,
} from "@/lib/services/background-task.service";
import { processAIQuizTask } from "@/lib/services/ai-quiz-processor.service";
import { determineSportFromTopic, fetchSourceMaterial } from "@/lib/services/ai-quiz-processor.service";
import { BackgroundTaskType } from "@prisma/client";

// Use Node.js runtime for long-running AI operations
export const runtime = 'nodejs';

// Shorter timeout since we return immediately - processing happens in background
export const maxDuration = 10; // seconds

const generateQuizSchema = z
  .object({
    topic: z.string().min(1).optional(),
    customTitle: z.string().min(1).optional(),
    sport: z.string().optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    numQuestions: z.number().int().min(1).max(50),
    sourceUrl: z.string().url().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.topic && !data.customTitle && !data.sourceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["topic"],
        message: "Provide a topic, custom title, or source URL for quiz generation.",
      });
    }
  });

export async function POST(request: NextRequest) {
  let taskId: string | null = null;
  try {
    const admin = await requireAdmin();

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestError(
        "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables."
      );
    }

    const body = await request.json();
    const { topic, customTitle, sport, difficulty, numQuestions, sourceUrl } =
      generateQuizSchema.parse(body);

    let effectiveTopic = (customTitle || topic || "").trim();

    let sourceMaterial: SourceMaterial | null = null;
    if (sourceUrl) {
      sourceMaterial = await fetchSourceMaterial(sourceUrl);
      if (!effectiveTopic && sourceMaterial?.derivedTopic) {
        effectiveTopic = sourceMaterial.derivedTopic;
      }
    }

    if (!effectiveTopic) {
      throw new BadRequestError(
        "Unable to determine a topic. Please provide a topic, custom title, or a descriptive source URL."
      );
    }

    // Determine sport from topic or use provided
    const derivedSportContext = `${effectiveTopic} ${sourceMaterial?.contentSnippet ?? ""}`;
    const quizSport = sport || determineSportFromTopic(derivedSportContext);

    const backgroundTask = await createBackgroundTask({
      userId: admin.id,
      type: BackgroundTaskType.AI_QUIZ_GENERATION,
      label: `AI Quiz • ${effectiveTopic}`,
      input: {
        topic,
        customTitle,
        sport,
        difficulty,
        numQuestions,
        sourceUrl,
        effectiveTopic,
        quizSport,
        sourceMaterial: sourceMaterial ? {
          url: sourceMaterial.url,
          title: sourceMaterial.title,
          contentSnippet: sourceMaterial.contentSnippet,
          derivedTopic: sourceMaterial.derivedTopic,
        } : null,
      },
    });
    taskId = backgroundTask.id;

    // Schedule background processing using Next.js after() function
    // This ensures the main endpoint returns quickly while processing happens reliably
    // Capture taskId in a const to ensure type narrowing works inside the callback
    const finalTaskId = taskId;
    if (finalTaskId) {
      after(async () => {
        try {
          await processAIQuizTask(finalTaskId);
        } catch {
          // Error handling is done inside processAIQuizTask
        }
      });
    }

    // Return immediately with task ID
    return successResponse({
      taskId,
      status: "processing",
      message: "Quiz generation started. Check the task status for progress.",
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

// SourceMaterial interface matches the one exported from service
interface SourceMaterial {
  url: string;
  title: string | null;
  contentSnippet: string;
  derivedTopic: string | null;
}
