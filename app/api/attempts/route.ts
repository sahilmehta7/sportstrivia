import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { getTopicIdsWithDescendants } from "@/lib/services/topic.service";
import { checkAttemptLimit } from "@/lib/services/attempt-limit.service";

const startAttemptSchema = z.object({
  quizId: z.string().cuid(),
  isPracticeMode: z.boolean().optional().default(false),
});

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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

    const attemptLimitResult = await checkAttemptLimit(prisma, {
      userId: user.id,
      quiz,
      isPracticeMode,
      referenceDate: now,
    });

    const attemptLimitMetadata = attemptLimitResult
      ? {
          max: attemptLimitResult.max,
          remaining: Math.max(
            attemptLimitResult.remainingBeforeStart - 1,
            0
          ),
          period: attemptLimitResult.period,
          resetAt: attemptLimitResult.resetAt
            ? attemptLimitResult.resetAt.toISOString()
            : null,
        }
      : null;

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
            bonusPointsPerSecond: true,
            timeBonusEnabled: true,
          },
        },
      },
    });

    const questionRecords = await prisma.question.findMany({
      where: {
        id: {
          in: selectedQuestionIds,
        },
      },
      include: {
        answers: {
          select: {
            id: true,
            answerText: true,
            answerImageUrl: true,
            answerVideoUrl: true,
            answerAudioUrl: true,
            isCorrect: true,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
    });

    const questionMap = new Map(questionRecords.map((record) => [record.id, record]));

    const serializedQuestions = selectedQuestionIds
      .map((questionId, index) => {
        const question = questionMap.get(questionId);
        if (!question) {
          return null;
        }

        const answers = question.answers.map((answer) => ({
          id: answer.id,
          answerText: answer.answerText,
          answerImageUrl: answer.answerImageUrl,
          answerVideoUrl: answer.answerVideoUrl,
          answerAudioUrl: answer.answerAudioUrl,
        }));

        const randomizedAnswers = question.randomizeAnswerOrder
          ? shuffleArray(answers)
          : answers;

        const correctAnswer = question.answers.find((answer) => answer.isCorrect);

        return {
          order: index,
          id: question.id,
          questionText: question.questionText,
          questionImageUrl: question.questionImageUrl,
          questionVideoUrl: question.questionVideoUrl,
          questionAudioUrl: question.questionAudioUrl,
          hint: question.hint,
          explanation: question.explanation,
          explanationImageUrl: question.explanationImageUrl,
          explanationVideoUrl: question.explanationVideoUrl,
          timeLimit: question.timeLimit,
          answers: randomizedAnswers,
          correctAnswerId: correctAnswer?.id ?? null,
        };
      })
      .filter((question): question is NonNullable<typeof question> => question !== null);

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
      attemptLimit: attemptLimitMetadata,
      questions: serializedQuestions,
    }, 201);
  } catch (error) {
    return handleError(error);
  }
}
