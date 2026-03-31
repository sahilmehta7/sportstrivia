import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError, ConflictError } from "@/lib/errors";
import {
  getAdminBackgroundTaskOrThrow,
  updateBackgroundTask,
  markBackgroundTaskCompletedFromFailed,
} from "@/lib/services/background-task.service";
import { BackgroundTaskType } from "@prisma/client";
import { extractJSON } from "@/lib/services/ai-quiz-processor.service";

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/ai-tasks/[id]/retry-parsing
 * 
 * Retry parsing JSON from a stored OpenAI response without making a new API call.
 * Useful when parsing fails but we want to preserve the expensive API response.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const task = await getAdminBackgroundTaskOrThrow(id);
    const attempt = (task as any).attempt ?? 1;
    if ((task as any).cancelledAttempt === attempt || task.status === "CANCELLED") {
      throw new BadRequestError("Cannot retry parsing for a cancelled task attempt.");
    }
    if (task.status !== "FAILED") {
      throw new BadRequestError("Parsing retry is only available for failed task attempts.");
    }

    // Verify this is an AI generation task
    if (
      task.type !== BackgroundTaskType.AI_QUIZ_GENERATION &&
      task.type !== BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION
    ) {
      throw new BadRequestError("This task type does not support parsing retry");
    }

    // Check if task has raw response stored
    const result = task.result as any;
    if (!result?.rawResponse) {
      throw new BadRequestError("No raw response found for this task. Cannot retry parsing.");
    }

    const { rawResponse, parseError } = result;
    const { rawGeneratedContent, rawCompletion } = rawResponse;

    if (!rawGeneratedContent) {
      throw new BadRequestError("No raw generated content found in stored response");
    }

    // Get the cleaned content from error or regenerate it
    let cleanedContent: string;
    if (parseError?.fullCleanedContent) {
      // Use the stored cleaned content if available
      cleanedContent = parseError.fullCleanedContent;
    } else {
      // Re-extract JSON from raw content
      cleanedContent = extractJSON(rawGeneratedContent);
    }

    // Try to parse the JSON
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (error: any) {
      // Update the parse error with new attempt
      const parseErrorUpdate = await updateBackgroundTask(id, {
        result: {
          ...result,
          parseError: {
            ...parseError,
            message: error.message,
            retryAttempts: (parseError?.retryAttempts || 0) + 1,
            lastRetryAt: new Date().toISOString(),
          },
        },
      }, { attempt });
      if (!parseErrorUpdate) {
        throw new ConflictError("Task attempt state changed while retrying parse. Reload and try again.");
      }
      
      throw new BadRequestError(`Failed to parse JSON on retry. Error: ${error.message}`);
    }

    // Parse succeeded! Now process based on task type
    if (task.type === BackgroundTaskType.AI_QUIZ_GENERATION) {
      // Normalize difficulty values
      if (parsed.difficulty) {
        parsed.difficulty = parsed.difficulty.toUpperCase();
      }
      if (Array.isArray(parsed.questions)) {
        parsed.questions = parsed.questions.map((q: any) => ({
          ...q,
          difficulty: q.difficulty ? q.difficulty.toUpperCase() : "MEDIUM",
        }));
      }

      // Get input metadata
      const input = task.input as any;
      const usageStats = {
        tokensUsed: rawCompletion?.usage?.total_tokens || 0,
        api: rawCompletion?.object === "response" ? "responses" : "chat_completions",
      };

      const metadata = {
        topic: input.effectiveTopic || input.topic,
        sport: input.quizSport || input.sport,
        difficulty: input.difficulty,
        numQuestions: input.numQuestions,
        model: input.model,
        api: usageStats.api,
        tokensUsed: usageStats.tokensUsed,
        promptPreview: rawResponse.prompt?.substring(0, 200) || "...",
        ...(input.customTitle ? { customTitle: input.customTitle } : {}),
        ...(input.sourceMaterial
          ? {
              sourceUrl: input.sourceMaterial.url,
              sourceTitle: input.sourceMaterial.title,
            }
          : {}),
      };

      const completed = await markBackgroundTaskCompletedFromFailed(id, {
        quiz: parsed,
        metadata,
        rawResponse,
        canRetryParsing: true,
        parseRetriedAt: new Date().toISOString(),
        parseRetrySuccessful: true,
      }, attempt);
      if (!completed) {
        throw new ConflictError("Task attempt state changed before completion. Reload and retry.");
      }

      return successResponse({
        taskId: id,
        status: "completed",
        message: "Parsing retry successful",
        quiz: parsed,
        metadata,
      });
    } else if (task.type === BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION) {
      // Handle topic question generation format
      const input = task.input as any;
      const questionsRaw: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.questions)
        ? parsed.questions
        : [];

      if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
        throw new BadRequestError("No questions found in parsed JSON");
      }

      // Normalize to expected shape
      const normalized = questionsRaw.map((q: any) => ({
        questionText: q.questionText || q.text || "",
        difficulty: String(q.difficulty || "MEDIUM").toUpperCase(),
        hint: q.hint || undefined,
        explanation: q.explanation || undefined,
        answers: (Array.isArray(q.answers) ? q.answers : []).map((a: any, i: number) => ({
          answerText: a.answerText || a.text || "",
          isCorrect: Boolean(a.isCorrect),
          displayOrder: i,
          answerImageUrl: "",
          answerVideoUrl: "",
          answerAudioUrl: "",
        })),
      }));

      const usageStats = {
        tokensUsed: rawCompletion?.usage?.total_tokens || 0,
        api: rawCompletion?.object === "response" ? "responses" : "chat_completions",
      };

      const resultPayload = {
        topicId: input.topicId,
        topicName: input.topicName,
        model: input.model,
        api: usageStats.api,
        requested: input.requested || {
          easyCount: input.easyCount || 0,
          mediumCount: input.mediumCount || 0,
          hardCount: input.hardCount || 0,
          total: input.total || 0,
        },
        questions: normalized,
        tokensUsed: usageStats.tokensUsed,
        promptPreview: rawResponse.prompt?.substring(0, 200) || "...",
        rawResponse,
        canRetryParsing: true,
        parseRetriedAt: new Date().toISOString(),
        parseRetrySuccessful: true,
      };

      const completed = await markBackgroundTaskCompletedFromFailed(id, resultPayload, attempt);
      if (!completed) {
        throw new ConflictError("Task attempt state changed before completion. Reload and retry.");
      }

      return successResponse({
        taskId: id,
        status: "completed",
        message: "Parsing retry successful",
        ...resultPayload,
      });
    }

    throw new BadRequestError("Unsupported task type");
  } catch (error) {
    return handleError(error);
  }
}
