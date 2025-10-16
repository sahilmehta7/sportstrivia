import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { getTopicIdsWithDescendants } from "@/lib/services/topic.service";

const startAttemptSchema = z.object({
  quizId: z.string().cuid(),
  isPracticeMode: z.boolean().optional().default(false),
});

// POST /api/attempts - Start a new quiz attempt
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { quizId, isPracticeMode } = startAttemptSchema.parse(body);

    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questionPool: {
          include: {
            question: {
              include: {
                answers: true,
                topic: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        topicConfigs: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    // Check if quiz is published and available
    if (!quiz.isPublished || quiz.status !== "PUBLISHED") {
      throw new BadRequestError("Quiz is not available");
    }

    // Check time restrictions
    const now = new Date();
    if (quiz.startTime && quiz.startTime > now) {
      throw new BadRequestError("Quiz has not started yet");
    }
    if (quiz.endTime && quiz.endTime < now) {
      throw new BadRequestError("Quiz has ended");
    }

    // Select questions based on selection mode
    let selectedQuestions: any[] = [];
    let selectedQuestionIds: string[] = [];

    if (quiz.questionSelectionMode === "FIXED") {
      // Use all questions in order
      selectedQuestions = quiz.questionPool.map((qp) => qp.question);
      selectedQuestionIds = selectedQuestions.map((q) => q.id);
    } else if (quiz.questionSelectionMode === "TOPIC_RANDOM") {
      // Select random questions from configured topics
      // Use Promise.all to fetch questions from all topics in parallel
      const questionsByTopic = await Promise.all(
        quiz.topicConfigs.map(async (config) => {
          // Get all descendant topics using cached service
          const topicIds = await getTopicIdsWithDescendants(config.topicId);

          // Get random questions from these topics
          return prisma.question.findMany({
            where: {
              topicId: { in: topicIds },
              difficulty: config.difficulty,
            },
            include: {
              answers: true,
              topic: true,
            },
            take: config.questionCount,
            orderBy: { id: "asc" }, // Will be randomized in production with Prisma extension
          });
        })
      );

      // Flatten the results
      selectedQuestions = questionsByTopic.flat();
      selectedQuestionIds = selectedQuestions.map((q) => q.id);
    } else if (quiz.questionSelectionMode === "POOL_RANDOM") {
      // Select random questions from quiz pool
      const poolSize = quiz.questionPool.length;
      const selectCount = quiz.questionCount || poolSize;

      // Shuffle and select
      const shuffled = quiz.questionPool.sort(() => Math.random() - 0.5);
      selectedQuestions = shuffled
        .slice(0, selectCount)
        .map((qp) => qp.question);
      selectedQuestionIds = selectedQuestions.map((q) => q.id);
    }

    // Randomize question order if configured
    if (quiz.randomizeQuestionOrder) {
      selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
    }

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        selectedQuestionIds,
        totalQuestions: selectedQuestions.length,
        isPracticeMode,
      },
      include: {
        quiz: {
          select: {
            title: true,
            slug: true,
            duration: true,
            timePerQuestion: true,
            passingScore: true,
            showHints: true,
            negativeMarkingEnabled: true,
            penaltyPercentage: true,
          },
        },
      },
    });

    // Prepare questions for response (remove correct answer info)
    const questionsForResponse = selectedQuestions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionImageUrl: q.questionImageUrl,
      questionVideoUrl: q.questionVideoUrl,
      questionAudioUrl: q.questionAudioUrl,
      hint: quiz.showHints ? q.hint : null,
      timeLimit: q.timeLimit,
      randomizeAnswerOrder: q.randomizeAnswerOrder,
      answers: q.answers
        .sort((a: any, b: any) => 
          q.randomizeAnswerOrder 
            ? Math.random() - 0.5 
            : a.displayOrder - b.displayOrder
        )
        .map((a: any) => ({
          id: a.id,
          answerText: a.answerText,
          answerImageUrl: a.answerImageUrl,
          answerVideoUrl: a.answerVideoUrl,
          answerAudioUrl: a.answerAudioUrl,
        })),
    }));

    return successResponse({
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        startedAt: attempt.startedAt,
        totalQuestions: attempt.totalQuestions,
        isPracticeMode: attempt.isPracticeMode,
      },
      quiz: attempt.quiz,
      questions: questionsForResponse,
    }, 201);
  } catch (error) {
    return handleError(error);
  }
}

