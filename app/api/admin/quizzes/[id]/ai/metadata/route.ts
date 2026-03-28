import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { getAIModel } from "@/lib/services/settings.service";
import { callOpenAIWithRetry, extractContentFromCompletion } from "@/lib/services/ai-openai-client.service";
import { extractJSON } from "@/lib/services/ai-quiz-processor.service";
import { getBudgetPolicyForRequest } from "@/lib/services/ai-budget-policy.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestError("OpenAI API key is not configured");
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questionPool: {
          include: {
            question: {
              select: {
                questionText: true,
                difficulty: true,
                topic: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
        topicConfigs: {
          include: { topic: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    const topics = new Set<string>();
    quiz.topicConfigs.forEach((config) => {
      if (config.topic?.name) {
        topics.add(config.topic.name);
      }
    });
    quiz.questionPool.forEach((poolItem) => {
      const topicName = poolItem.question.topic?.name;
      if (topicName) {
        topics.add(topicName);
      }
    });

    const sampleQuestions = quiz.questionPool
      .slice(0, 6)
      .map((poolItem, index) => {
        const q = poolItem.question;
        return `${index + 1}. (${q.difficulty}) ${q.questionText.trim()}`;
      });

    const prompt = `You are an expert sports marketing copywriter. Refresh the quiz title and description to be catchy, precise, and inviting. Return JSON with keys \\"title\\" (max 60 characters) and \\"description\\" (2 sentences, under 280 characters). Avoid emojis and clickbait. Quiz context:
Current title: ${quiz.title || "(none)"}
Current description: ${quiz.description || "(none)"}
Primary topics: ${Array.from(topics).join(", ") || "General sports"}
Difficulty: ${quiz.difficulty}
Sample questions:\n${sampleQuestions.join("\n") || "No questions available"}
Include unique angles or hooks pulled from the questions.`;

    const aiModel = await getAIModel();
    const completion = await callOpenAIWithRetry(
      aiModel,
      prompt,
      "You craft concise, compelling sports quiz titles and descriptions. Always respond with valid JSON matching the requested schema.",
      {
        temperature: 0.7,
        maxTokens: 500,
        responseFormat: aiModel.startsWith("o1") ? null : { type: "json_object" },
        cacheable: true,
        cacheKeyContext: { type: "quiz_metadata", quizId: id, title: quiz.title, topics: Array.from(topics) },
        budgetPolicy: getBudgetPolicyForRequest("quiz_metadata"),
      }
    );
    const content = extractContentFromCompletion(completion, aiModel);

    if (!content) {
      throw new BadRequestError("OpenAI response did not contain any content");
    }

    let parsed;
    try {
      parsed = JSON.parse(extractJSON(content));
    } catch (error: any) {
      throw new BadRequestError(
        `Failed to parse OpenAI response. Ensure JSON formatting. Error: ${error.message}`
      );
    }

    if (!parsed.title || !parsed.description) {
      throw new BadRequestError("OpenAI response missing title or description");
    }

    return successResponse({
      title: parsed.title,
      description: parsed.description,
    });
  } catch (error) {
    return handleError(error);
  }
}
