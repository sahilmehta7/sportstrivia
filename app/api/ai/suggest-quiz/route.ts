import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { getAIQuizPrompt, getAIModel } from "@/lib/services/settings.service";
import { callOpenAIWithRetry, extractContentFromCompletion, extractUsageStats } from "@/lib/services/ai-openai-client.service";
import { getBudgetPolicyForRequest } from "@/lib/services/ai-budget-policy.service";
import { extractJSON } from "@/lib/services/ai-quiz-processor.service";

// Simple in-memory rate limit per user: 3 requests/hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const rateStore = new Map<string, { count: number; resetAt: number }>();

// Use Node.js runtime for long-running AI operations
export const runtime = 'nodejs';

// Increase route timeout for AI generation
export const maxDuration = 60;

const suggestQuizSchema = z.object({
  topic: z.string().min(1),
  sport: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  numQuestions: z.number().int().min(1).max(50).default(10),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestError(
        "AI suggestions are unavailable. Ask the admin to configure OPENAI_API_KEY."
      );
    }

    // Rate limit
    const now = Date.now();
    const current = rateStore.get(user.id);
    if (!current || now > current.resetAt) {
      rateStore.set(user.id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      if (current.count >= RATE_LIMIT_MAX) {
        const secs = Math.max(1, Math.round((current.resetAt - now) / 1000));
        throw new BadRequestError(`Rate limit exceeded. Try again in ${secs}s.`);
      }
      current.count += 1;
      rateStore.set(user.id, current);
    }

    const body = await request.json();
    const { topic, sport, difficulty, numQuestions } = suggestQuizSchema.parse(body);

    const quizSport = sport || determineSportFromTopic(topic);
    const slugifiedTopic = topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const promptTemplate = await getAIQuizPrompt();
    const aiModel = await getAIModel();
    const prompt = buildPrompt(promptTemplate, topic, quizSport, difficulty, numQuestions, slugifiedTopic);

    let systemMessage =
      "You are an expert sports quiz creator. You create engaging, accurate, and well-structured sports trivia quizzes in strict JSON format.";
    if (aiModel.startsWith("o1")) {
      systemMessage =
        "You are an expert sports quiz creator. CRITICAL: Output ONLY valid JSON with no extra text. JSON must match the user prompt structure exactly.";
    }

    const completion = await callOpenAIWithRetry(
      aiModel,
      prompt,
      systemMessage,
      {
        temperature: !aiModel.startsWith("o1") && !aiModel.startsWith("gpt-5") ? 0.7 : undefined,
        maxTokens: aiModel.startsWith("gpt-5") || aiModel.startsWith("o1") ? 16000 : 4000,
        responseFormat: aiModel.startsWith("o1") ? null : { type: "json_object" },
        cacheable: true,
        cacheKeyContext: { type: "quiz_suggest", topic, difficulty, numQuestions, sport: quizSport },
        budgetPolicy: getBudgetPolicyForRequest("quiz_suggest"),
      }
    );
    const generatedContent = extractContentFromCompletion(completion, aiModel);
    const cleanedContent = extractJSON(generatedContent);
    let generatedQuiz;
    try {
      generatedQuiz = JSON.parse(cleanedContent);
    } catch (error: any) {
      throw new BadRequestError(
        `Failed to parse generated quiz JSON. Error: ${error.message}. Try a different model in settings.`
      );
    }

    if (generatedQuiz.difficulty) {
      generatedQuiz.difficulty = String(generatedQuiz.difficulty).toUpperCase();
    }
    if (Array.isArray(generatedQuiz.questions)) {
      generatedQuiz.questions = generatedQuiz.questions.map((q: any) => ({
        ...q,
        difficulty: q.difficulty ? String(q.difficulty).toUpperCase() : "MEDIUM",
      }));
    }

    const usageStats = extractUsageStats(completion);
    return successResponse({
      quiz: generatedQuiz,
      metadata: {
        topic,
        sport: quizSport,
        difficulty,
        numQuestions,
        model: aiModel,
        tokensUsed: usageStats.tokensUsed,
        api: usageStats.api,
        promptPreview: prompt.substring(0, 200) + "...",
        llmTelemetry: (completion as any)?._codexMeta ?? null,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

function buildPrompt(
  template: string,
  topic: string,
  sport: string,
  difficulty: string,
  numQuestions: number,
  slugifiedTopic: string
): string {
  return template
    .replace(/\{\{TOPIC\}\}/g, topic)
    .replace(/\{\{TOPIC_LOWER\}\}/g, topic.toLowerCase())
    .replace(/\{\{SLUGIFIED_TOPIC\}\}/g, slugifiedTopic)
    .replace(/\{\{SPORT\}\}/g, sport)
    .replace(/\{\{DIFFICULTY\}\}/g, difficulty)
    .replace(/\{\{NUM_QUESTIONS\}\}/g, numQuestions.toString())
    .replace(/\{\{DURATION\}\}/g, (numQuestions * 60).toString());
}

function determineSportFromTopic(topic: string): string {
  const topicLower = topic.toLowerCase();
  const sportKeywords: Record<string, string[]> = {
    Cricket: ["cricket", "ipl", "test match", "odi", "t20", "bcci"],
    Basketball: ["basketball", "nba", "wnba", "dunk", "three-pointer"],
    Football: ["football", "nfl", "quarterback", "touchdown", "super bowl"],
    Soccer: ["soccer", "fifa", "premier league", "champions league", "messi", "ronaldo"],
    Baseball: ["baseball", "mlb", "home run", "world series"],
    Tennis: ["tennis", "wimbledon", "grand slam", "atp", "wta"],
    Hockey: ["hockey", "nhl", "stanley cup"],
    Golf: ["golf", "pga", "masters"],
  };
  for (const [sport, keywords] of Object.entries(sportKeywords)) {
    if (keywords.some((k) => topicLower.includes(k))) return sport;
  }
  return "General";
}
