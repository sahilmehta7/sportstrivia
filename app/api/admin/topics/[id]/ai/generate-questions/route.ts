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
} from "@/lib/services/background-task.service";
import { BackgroundTaskType } from "@prisma/client";

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

    const usesNewParams = aiModel.startsWith("gpt-5") || aiModel.startsWith("o1");

    // System message matches handling in AI quiz generator, emphasizing JSON-only when needed
    let systemMessage = "You are an expert sports quiz creator. You create engaging, accurate questions in strict JSON format.";
    if (aiModel.startsWith("o1")) {
      systemMessage = "You are an expert sports quiz creator. CRITICAL: Output ONLY valid JSON. No markdown or extra text.";
    }

    const requestBody: any = {
      model: aiModel,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
    };

    if (!aiModel.startsWith("o1") && !aiModel.startsWith("gpt-5")) {
      requestBody.temperature = 0.8;
    }
    if (usesNewParams) {
      requestBody.max_completion_tokens = 16000;  // Higher limit for GPT-5 reasoning models
    } else {
      requestBody.max_tokens = 4000;  // Increased from 3000 for larger question sets
    }
    if (!aiModel.startsWith("o1")) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new BadRequestError(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const completion = await response.json();

    let generatedContent: string | null = null;
    if (completion.choices?.[0]?.message?.content) {
      generatedContent = completion.choices[0].message.content;
    } else if (completion.choices?.[0]?.text) {
      generatedContent = completion.choices[0].text;
    } else if (completion.content) {
      generatedContent = completion.content;
    } else if (completion.message?.content) {
      generatedContent = completion.message.content;
    } else if (completion.output) {
      generatedContent = completion.output;
    } else if (completion.data) {
      generatedContent = completion.data;
    }

    if (!generatedContent) {
      throw new BadRequestError(`No content generated from OpenAI. Model: ${aiModel}.`);
    }

    const cleanedContent = extractJSON(generatedContent);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (error: any) {
      throw new BadRequestError(`Failed to parse generated JSON. ${error.message}`);
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

    const resultPayload = {
      topicId: id,
      topicName: topic.name,
      model: aiModel,
      requested: { easyCount, mediumCount, hardCount, total },
      questions: normalized,
      tokensUsed: completion.usage?.total_tokens || 0,
      promptPreview: `${prompt.substring(0, 200)}...`,
    };

    if (taskId) {
      try {
        await markBackgroundTaskCompleted(taskId, resultPayload);
      } catch (taskError) {
        console.error("[AI Question Generator] Failed to mark background task completed:", taskError);
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
      } catch (taskError) {
        console.error("[AI Question Generator] Failed to update background task status:", taskError);
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

function extractJSON(content: string): string {
  content = String(content || "").trim();
  const markdownMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (markdownMatch) return markdownMatch[1].trim();
  const jsonMatch = content.match(/(\{[\s\S]*\})/);
  return jsonMatch ? jsonMatch[1].trim() : content;
}
