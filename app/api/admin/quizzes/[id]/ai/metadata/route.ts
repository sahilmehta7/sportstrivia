import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";

const MODEL = "gpt-4o";

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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You craft concise, compelling sports quiz titles and descriptions. Always respond with valid JSON matching the requested schema.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: {
          type: "json_object",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new BadRequestError(
        `OpenAI API error: ${error.error?.message || response.statusText}`
      );
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new BadRequestError("OpenAI response did not contain any content");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
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
