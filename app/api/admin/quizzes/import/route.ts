import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { quizImportSchema } from "@/lib/validations/quiz.schema";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/services/slug.service";
import { Prisma, Difficulty, QuestionType } from "@prisma/client";

// Increase route timeout for large quiz imports (100+ questions can take 30-60 seconds)
export const maxDuration = 60; // seconds

interface QuizImportAnswer {
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

interface QuizImportQuestion {
  text: string;
  type?: string;
  difficulty: Difficulty;
  topic?: string;
  hint?: string;
  explanation?: string;
  order?: number;
  answers: QuizImportAnswer[];
}

interface QuizImportInput {
  title: string;
  slug?: string;
  description?: string;
  sport?: string;
  difficulty: Difficulty;
  duration?: number;
  passingScore: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  questions: QuizImportQuestion[];
}

/**
 * Normalize difficulty values to uppercase for case-insensitive input
 */
function normalizeDifficulty(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  // Validate it's a valid difficulty
  if (['EASY', 'MEDIUM', 'HARD'].includes(normalized)) {
    return normalized;
  }
  return value; // Return original if invalid, let schema validation handle the error
}

// POST /api/admin/quizzes/import - Bulk import quiz from JSON
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    
    // Normalize difficulty values to uppercase (case-insensitive input)
    if (body.difficulty) {
      body.difficulty = normalizeDifficulty(body.difficulty);
    }
    if (Array.isArray(body.questions)) {
      body.questions = body.questions.map((q: any) => ({
        ...q,
        difficulty: normalizeDifficulty(q.difficulty)
      }));
    }
    
    // Validate the input
    const parseResult = quizImportSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.format() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Extract validated data with type assertion
    const validatedData = parseResult.data as QuizImportInput;
    const {
      title,
      slug: providedSlug,
      description,
      sport,
      difficulty,
      duration,
      passingScore,
      seo,
      questions
    } = validatedData;

    // Generate unique slug
    const slug = providedSlug
      ? await generateUniqueSlug(providedSlug, "quiz")
      : await generateUniqueSlug(title, "quiz");

    // Create quiz and questions in a transaction with extended timeout for large imports
    const quiz = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get or create default topic if needed
      let defaultTopic = await tx.topic.findFirst({
        where: { slug: "general" },
      });

      if (!defaultTopic) {
        defaultTopic = await tx.topic.create({
          data: {
            name: "General",
            slug: "general",
            description: "General questions",
            level: 0,
          },
        });
      }

      // Create the quiz
      const newQuiz = await tx.quiz.create({
        data: {
          title,
          slug,
          description,
          sport,
          difficulty,
          duration,
          passingScore,
          seoTitle: seo?.title,
          seoDescription: seo?.description,
          seoKeywords: seo?.keywords || [],
          questionSelectionMode: "FIXED",
          status: "DRAFT",
        },
      });

      // Validate all topics at once (batch validation)
      const normalizeTopicName = (name: string) => name.trim().toLowerCase();
      const topicOriginalNameMap = new Map<string, string>();

      for (const name of questions
        .map((q) => q.topic?.trim())
        .filter((name): name is string => Boolean(name))) {
        const normalized = normalizeTopicName(name);
        if (!topicOriginalNameMap.has(normalized)) {
          topicOriginalNameMap.set(normalized, name);
        }
      }

      const topicNameMap = new Map<string, { id: string }>();

      if (topicOriginalNameMap.size > 0) {
        const normalizedNames = Array.from(topicOriginalNameMap.keys());
        const existingTopics = await tx.topic.findMany({
          where: {
            OR: normalizedNames.map((normalized) => ({
              name: {
                equals: topicOriginalNameMap.get(normalized)!,
                mode: "insensitive" as const,
              },
            })),
          },
          select: { id: true, name: true },
        });

        for (const topic of existingTopics) {
          topicNameMap.set(normalizeTopicName(topic.name), { id: topic.id });
        }

        for (const normalizedName of normalizedNames) {
          if (topicNameMap.has(normalizedName)) {
            continue;
          }

          const topicName = topicOriginalNameMap.get(normalizedName)!;

          const newTopic = await tx.topic.create({
            data: {
              name: topicName,
              slug: await generateUniqueSlug(topicName, "topic"),
              level: 0,
            },
          });

          topicNameMap.set(normalizedName, { id: newTopic.id });
        }
      }

      // Create all questions in batches to avoid overwhelming the database
      // Process in chunks of 20 questions at a time
      const BATCH_SIZE = 20;
      const createdQuestions = [];
      
      for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map((questionData) => {
            // Determine question type - cast to enum
            const questionType = (questionData.type
              ? questionData.type.toUpperCase()
              : "MULTIPLE_CHOICE") as QuestionType;

            // Use provided topic or default
            const normalizedTopicName = questionData.topic
              ? normalizeTopicName(questionData.topic)
              : null;
            const topicId = normalizedTopicName
              ? topicNameMap.get(normalizedTopicName)?.id || defaultTopic.id
              : defaultTopic.id;

            return tx.question.create({
              data: {
                type: questionType,
                topicId,
                difficulty: questionData.difficulty,
                questionText: questionData.text,
                hint: questionData.hint,
                explanation: questionData.explanation,
                answers: {
                  create: questionData.answers.map((answer, idx) => ({
                    answerText: answer.text,
                    answerImageUrl: answer.imageUrl,
                    isCorrect: answer.isCorrect,
                    displayOrder: idx,
                  })),
                },
              },
            });
          })
        );
        createdQuestions.push(...batchResults);
      }

      // Create quiz question pool entries in batch
      // Ensure no duplicate order values for FIXED mode (schema constraint workaround)
      const poolEntries = createdQuestions.map((question, i) => ({
        quizId: newQuiz.id,
        questionId: question.id,
        order: questions[i].order || i + 1,
        points: 1,
      }));

      // Validate unique order values
      const orderValues = poolEntries.map(e => e.order).filter(o => o !== null);
      const uniqueOrders = new Set(orderValues);
      if (orderValues.length !== uniqueOrders.size) {
        throw new BadRequestError("Duplicate order values detected in question pool. Each question must have a unique order for FIXED mode quizzes.");
      }

      await tx.quizQuestionPool.createMany({
        data: poolEntries,
      });

      // Return the complete quiz with questions
      return await tx.quiz.findUnique({
        where: { id: newQuiz.id },
        include: {
          questionPool: {
            include: {
              question: {
                include: {
                  answers: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              questionPool: true,
            },
          },
        },
      });
    }, {
      maxWait: 30000, // Maximum wait time to acquire a transaction (30 seconds)
      timeout: 60000,  // Maximum time the transaction can run (60 seconds)
    });

    return successResponse(
      {
        quiz,
        message: "Quiz imported successfully",
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
