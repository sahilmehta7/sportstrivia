import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { quizImportSchema } from "@/lib/validations/quiz.schema";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/services/slug.service";
import { Prisma, Difficulty, QuestionType } from "@prisma/client";

// Use Node.js runtime for long-running import operations
export const runtime = 'nodejs';

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
  timePerQuestion?: number;
  maxAttemptsPerUser?: number;
  showHints?: boolean;
  randomizeQuestionOrder?: boolean;
  completionBonus?: number;
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
      timePerQuestion,
      maxAttemptsPerUser,
      showHints,
      randomizeQuestionOrder,
      completionBonus,
      passingScore,
      seo,
      questions
    } = validatedData;

    // Calculate completion bonus if not provided
    const finalCompletionBonus = completionBonus ?? (questions.length * 100);

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

      // Collect topic usage and determine primary sport
      const topicUsageMap = new Map<string, { count: number; configs: Set<string> }>();

      const normalizeTopicName = (name: string) => name.trim().toLowerCase();
      const topicOriginalNameMap = new Map<string, string>();

      for (const q of questions) {
        const topicName = q.topic?.trim() || "General";
        const normalized = normalizeTopicName(topicName);
        if (!topicOriginalNameMap.has(normalized)) {
          topicOriginalNameMap.set(normalized, topicName);
        }

        const usage = topicUsageMap.get(normalized) || { count: 0, configs: new Set<string>() };
        usage.count++;
        usage.configs.add(q.difficulty);
        topicUsageMap.set(normalized, usage);
      }

      // Resolve all topics at once
      const topicNameMap = new Map<string, { id: string; name: string }>();
      const normalizedNames = Array.from(topicOriginalNameMap.keys());

      if (normalizedNames.length > 0) {
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
          topicNameMap.set(normalizeTopicName(topic.name), { id: topic.id, name: topic.name });
        }

        for (const normalizedName of normalizedNames) {
          if (topicNameMap.has(normalizedName)) continue;

          const topicName = topicOriginalNameMap.get(normalizedName)!;
          try {
            const newTopic = await tx.topic.create({
              data: {
                name: topicName,
                slug: await generateUniqueSlug(topicName, "topic"),
                level: 0,
              },
            });
            topicNameMap.set(normalizedName, { id: newTopic.id, name: newTopic.name });
          } catch (error: any) {
            if (error.code === 'P2002') {
              const existing = await tx.topic.findFirst({
                where: { name: { equals: topicName, mode: "insensitive" } }
              });
              if (existing) {
                topicNameMap.set(normalizedName, { id: existing.id, name: existing.name });
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }
        }
      }

      // Determine the most frequent topic to use for Sport auto-detection (if Sport not provided)
      let primaryTopicName = "General";
      let maxCount = -1;
      for (const [name, usage] of topicUsageMap.entries()) {
        if (usage.count > maxCount) {
          maxCount = usage.count;
          primaryTopicName = topicOriginalNameMap.get(name) || "General";
        }
      }

      // Resolve sport to a canonical Level 0 Topic (root topic)
      let canonicalSportName: string | undefined = undefined;
      const sportToResolve = (sport && sport.trim().length > 0) ? sport.trim() : primaryTopicName;

      if (sportToResolve) {
        const existingRoot = await tx.topic.findFirst({
          where: {
            parentId: null,
            name: { equals: sportToResolve, mode: "insensitive" },
          },
          select: { id: true, name: true },
        });

        if (existingRoot) {
          canonicalSportName = existingRoot.name; // preserve canonical casing
        } else {
          try {
            const createdRoot = await tx.topic.create({
              data: {
                name: sportToResolve,
                slug: await generateUniqueSlug(sportToResolve, "topic"),
                level: 0,
              },
              select: { name: true },
            });
            canonicalSportName = createdRoot.name;
          } catch (error: any) {
            if (error.code === 'P2002') {
              const retryRoot = await tx.topic.findFirst({
                where: { name: { equals: sportToResolve, mode: "insensitive" } }
              });
              canonicalSportName = retryRoot?.name;
            } else {
              throw error;
            }
          }
        }
      }

      // Create the quiz
      const newQuiz = await tx.quiz.create({
        data: {
          title,
          slug,
          description,
          sport: canonicalSportName,
          difficulty,
          duration,
          timePerQuestion,
          maxAttemptsPerUser,
          showHints,
          randomizeQuestionOrder,
          completionBonus: finalCompletionBonus,
          passingScore,
          seoTitle: seo?.title,
          seoDescription: seo?.description,
          seoKeywords: seo?.keywords || [],
          questionSelectionMode: "FIXED",
          status: "DRAFT",
        },
      });

      // Create Topic Configurations automatically
      const topicConfigsToCreate = [];
      for (const [normalizedName, usage] of topicUsageMap.entries()) {
        const topicId = topicNameMap.get(normalizedName)?.id;
        if (!topicId) continue;

        // Count questions per difficulty for this topic
        const difficultyCounts = new Map<string, number>();
        for (const q of questions) {
          const qTopic = normalizeTopicName(q.topic || "General");
          if (qTopic === normalizedName) {
            const d = q.difficulty;
            difficultyCounts.set(d, (difficultyCounts.get(d) || 0) + 1);
          }
        }

        for (const [diff, count] of difficultyCounts.entries()) {
          topicConfigsToCreate.push({
            quizId: newQuiz.id,
            topicId,
            difficulty: diff as Difficulty,
            questionCount: count,
          });
        }
      }

      if (topicConfigsToCreate.length > 0) {
        await tx.quizTopicConfig.createMany({
          data: topicConfigsToCreate,
        });
      }

      // Create all questions in batches to avoid overwhelming the database
      const BATCH_SIZE = 20;
      const createdQuestions = [];

      for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map((questionData) => {
            const questionType = (questionData.type
              ? questionData.type.toUpperCase()
              : "MULTIPLE_CHOICE") as QuestionType;

            const normalizedTopicName = normalizeTopicName(questionData.topic || "General");
            const topicId = topicNameMap.get(normalizedTopicName)?.id || defaultTopic!.id;

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
          topicConfigs: {
            include: {
              topic: true
            }
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
        message: "Quiz imported successfully with automatically derived topic configurations",
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
