import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";

// GET /api/attempts/[id] - Get attempt results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            slug: true,
            passingScore: true,
            answersRevealTime: true,
            timePerQuestion: true,
          },
        },
        userAnswers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionImageUrl: true,
                explanation: true,
                explanationImageUrl: true,
                explanationVideoUrl: true,
                timeLimit: true,
              },
            },
            answer: {
              select: {
                id: true,
                answerText: true,
                answerImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt not found");
    }

    // Verify ownership
    if (attempt.userId !== user.id) {
      throw new Error("Unauthorized");
    }

    // Check if answers should be revealed
    const now = new Date();
    const revealAnswers =
      attempt.completedAt &&
      (!attempt.quiz.answersRevealTime ||
        attempt.quiz.answersRevealTime <= now);

    // Get correct answers if they should be revealed
    const correctAnswersMap = new Map<string, { id: string; answerText: string; answerImageUrl: string | null }>();
    if (revealAnswers) {
      const questionIds = attempt.userAnswers.map((ua) => ua.questionId);
      const questions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
        include: {
          answers: {
            where: { isCorrect: true },
            select: {
              id: true,
              answerText: true,
              answerImageUrl: true,
            },
          },
        },
      });

      for (const question of questions) {
        const correctAnswer = question.answers[0];
        if (correctAnswer) {
          correctAnswersMap.set(question.id, correctAnswer);
        }
      }
    }

    const response = {
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        passed: attempt.passed,
        totalPoints: attempt.totalPoints,
        longestStreak: attempt.longestStreak,
        averageResponseTime: attempt.averageResponseTime,
        totalTimeSpent: attempt.totalTimeSpent,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        isPracticeMode: attempt.isPracticeMode,
      },
      quiz: attempt.quiz,
      revealAnswers,
      answers: attempt.userAnswers.map((ua) => ({
        questionId: ua.questionId,
        questionText: ua.question.questionText,
        questionImageUrl: ua.question.questionImageUrl,
        userAnswer: ua.answer,
        isCorrect: ua.isCorrect,
        wasSkipped: ua.wasSkipped,
        timeSpent: ua.timeSpent,
        basePoints: ua.basePoints,
        timeBonus: ua.timeBonus,
        streakBonus: ua.streakBonus,
        totalPoints: ua.totalPoints,
        timeLimit: ua.question.timeLimit ?? attempt.quiz.timePerQuestion ?? 60,
        ...(revealAnswers && {
          correctAnswer: correctAnswersMap.get(ua.questionId),
          explanation: ua.question.explanation,
          explanationImageUrl: ua.question.explanationImageUrl,
          explanationVideoUrl: ua.question.explanationVideoUrl,
        }),
      })),
    };

    return successResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
