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
    await markBackgroundTaskInProgress(taskId);

    const slugifiedTopic = topic.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Build a question-only prompt, preserving admin-editable template context
    const prompt = buildQuestionsOnlyPrompt(
      baseTemplate,
      topic.name,
      topic.level === 0 ? topic.name : (topic.name),
      total,
      slugifiedTopic,
      { easyCount, mediumCount, hardCount }
    );

    // Build system message based on model type
    const isO1 = aiModel.startsWith("o1");
    let systemMessage = "You are an expert sports quiz creator. You create engaging, accurate questions in strict JSON format.";
    if (isO1) {
      systemMessage = "You are an expert sports quiz creator. CRITICAL: Output ONLY valid JSON. No markdown or extra text.";
    }

    // Call OpenAI API with hybrid support (Responses API for GPT-5, Chat Completions for others)
    const completion = await callOpenAIWithRetry(
      aiModel,
      prompt,
      systemMessage,
      {
        temperature: 0.8,
        maxTokens: isO1 ? 16000 : 4000,
        responseFormat: isO1 ? null : { type: "json_object" },
      }
    );

    // Extract content from response (handles both API formats)
    const generatedContent = extractContentFromCompletion(completion, aiModel);

    // Store raw OpenAI response permanently (expensive API call - don't lose it!)
    // This allows us to retry parsing without another API call
    const rawResponseData = {
      rawCompletion: completion,
      rawGeneratedContent: generatedContent,
      prompt: prompt.substring(0, 5000), // Store prompt preview (truncated if very long)
    };

    const cleanedContent = extractJSON(generatedContent);
    let parsed: any;
    let parseError: string | null = null;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (error: any) {
      parseError = error.message;
      
      // Store raw response even on parse failure so we can retry parsing later
      await updateBackgroundTask(taskId, {
        result: {
          rawResponse: rawResponseData,
          parseError: {
            message: parseError,
            cleanedContent: cleanedContent.substring(0, 2000), // Store first 2000 chars for debugging
            fullCleanedContent: cleanedContent, // Store full content for retry
          },
          canRetryParsing: true,
        },
      });
      
      throw new BadRequestError(`Failed to parse generated JSON. ${error.message}. You can retry parsing from the admin portal.`);
    }

    // Accept either { questions: [...] } or a raw array [...] for flexibility
    const questionsRaw: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];
    if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
      throw new BadRequestError("No questions found in AI output");
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

    // Extract usage stats - different APIs have different structures
    const usageStats = extractUsageStats(completion);

    const resultPayload = {
      topicId: id,
      topicName: topic.name,
      model: aiModel,
      api: usageStats.api,
      requested: { easyCount, mediumCount, hardCount, total },
      questions: normalized,
      tokensUsed: usageStats.tokensUsed,
      promptPreview: `${prompt.substring(0, 200)}...`,
      rawResponse: rawResponseData, // Store permanently for retry capability
      canRetryParsing: true, // Flag indicating this task can have parsing retried
    };

    if (taskId) {
      try {
        await markBackgroundTaskCompleted(taskId, resultPayload);
      } catch {
        // Silently handle task completion errors
      }
    }

    return successResponse({
      taskId,
      ...resultPayload,
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
