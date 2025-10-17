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
          select: {
            questionId: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
        topicConfigs: true,
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
    let selectedQuestionIds: string[] = [];

    if (quiz.questionSelectionMode === "FIXED") {
      // Use all questions in order
      selectedQuestionIds = quiz.questionPool.map((qp) => qp.questionId);
    } else if (quiz.questionSelectionMode === "TOPIC_RANDOM") {
      // Select random questions from configured topics
      // Use Promise.all to fetch questions from all topics in parallel
      const questionsByTopic = await Promise.all(
        quiz.topicConfigs.map(async (config) => {
          // Get all descendant topics using cached service
          const topicIds = await getTopicIdsWithDescendants(config.topicId);

          // Fetch ALL matching questions (not just take N)
          const allQuestions = await prisma.question.findMany({
            where: {
              topicId: { in: topicIds },
              difficulty: config.difficulty,
            },
            select: { id: true },
          });

          // Shuffle and select the required number
          const shuffled = allQuestions.sort(() => Math.random() - 0.5);
          return shuffled.slice(0, config.questionCount);
        })
      );

      // Flatten the results
      selectedQuestionIds = questionsByTopic.flat().map((q) => q.id);
    } else if (quiz.questionSelectionMode === "POOL_RANDOM") {
      // Select random questions from quiz pool
      const poolSize = quiz.questionPool.length;
      const selectCount = quiz.questionCount || poolSize;

      // Shuffle and select
      const shuffled = quiz.questionPool.sort(() => Math.random() - 0.5);
      selectedQuestionIds = shuffled
        .slice(0, selectCount)
        .map((qp) => qp.questionId);
    }

    // Randomize question order if configured
    if (quiz.randomizeQuestionOrder) {
      selectedQuestionIds = selectedQuestionIds.sort(() => Math.random() - 0.5);
    }

    if (selectedQuestionIds.length === 0) {
      throw new BadRequestError("Quiz has no questions available");
    }

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        selectedQuestionIds,
        totalQuestions: selectedQuestionIds.length,
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

    return successResponse({
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        startedAt: attempt.startedAt,
        totalQuestions: attempt.totalQuestions,
        isPracticeMode: attempt.isPracticeMode,
      },
      quiz: attempt.quiz,
      totalQuestions: attempt.totalQuestions,
    }, 201);
  } catch (error) {
    return handleError(error);
  }
}
