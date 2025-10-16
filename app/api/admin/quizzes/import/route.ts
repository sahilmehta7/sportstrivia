import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { quizImportSchema } from "@/lib/validations/quiz.schema";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/services/slug.service";
import { Prisma, Difficulty, QuestionType } from "@prisma/client";

interface QuizImportAnswer {
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

interface QuizImportQuestion {
  text: string;
  type?: string;
  difficulty: Difficulty;
  topicId?: string;
  hint?: string;
  explanation?: string;
  order?: number;
  answers: QuizImportAnswer[];
}

interface QuizImportInput {
  title: string;
  slug?: string;
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

// POST /api/admin/quizzes/import - Bulk import quiz from JSON
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    
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

    // Create quiz and questions in a transaction
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
      const uniqueTopicIds = [
        ...new Set(questions.map((q) => q.topicId).filter((id): id is string => Boolean(id))),
      ];
      
      if (uniqueTopicIds.length > 0) {
        const existingTopics = await tx.topic.findMany({
          where: { id: { in: uniqueTopicIds } },
          select: { id: true },
        });
        const existingTopicIds = new Set(existingTopics.map((t) => t.id));
        
        // Check if all required topics exist
        for (const topicId of uniqueTopicIds) {
          if (!existingTopicIds.has(topicId)) {
            throw new NotFoundError(`Topic with ID ${topicId} not found`);
          }
        }
      }

      // Create all questions in parallel using Promise.all
      const createdQuestions = await Promise.all(
        questions.map((questionData, i) => {
          // Determine question type - cast to enum
          const questionType = (questionData.type
            ? questionData.type.toUpperCase()
            : "MULTIPLE_CHOICE") as QuestionType;

          // Use provided topicId or default
          const topicId = questionData.topicId || defaultTopic.id;

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

      // Create quiz question pool entries in batch
      await tx.quizQuestionPool.createMany({
        data: createdQuestions.map((question, i) => ({
          quizId: newQuiz.id,
          questionId: question.id,
          order: questions[i].order || i + 1,
          points: 1,
        })),
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
