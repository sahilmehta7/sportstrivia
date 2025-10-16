import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        completedAt: true,
        selectedQuestionIds: true,
        totalQuestions: true,
        userAnswers: {
          select: {
            questionId: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt not found");
    }

    if (attempt.userId !== user.id) {
      throw new BadRequestError("You do not have access to this attempt");
    }

    const answeredCount = attempt.userAnswers.length;
    const total = attempt.selectedQuestionIds.length;

    if (attempt.completedAt || answeredCount >= total) {
      return successResponse({
        nextQuestion: null,
        position: answeredCount,
        total,
      });
    }

    const nextQuestionId = attempt.selectedQuestionIds[answeredCount];

    const question = await prisma.question.findUnique({
      where: { id: nextQuestionId },
      include: {
        answers: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const answers = question.answers.map((answer) => ({
      id: answer.id,
      answerText: answer.answerText,
      answerImageUrl: answer.answerImageUrl,
      answerVideoUrl: answer.answerVideoUrl,
      answerAudioUrl: answer.answerAudioUrl,
    }));

    const randomizedAnswers = question.randomizeAnswerOrder
      ? [...answers].sort(() => Math.random() - 0.5)
      : answers;

    return successResponse({
      nextQuestion: {
        id: question.id,
        questionText: question.questionText,
        questionImageUrl: question.questionImageUrl,
        questionVideoUrl: question.questionVideoUrl,
        questionAudioUrl: question.questionAudioUrl,
        hint: question.hint,
        explanation: question.explanation,
        timeLimit: question.timeLimit,
        answers: randomizedAnswers,
      },
      position: answeredCount,
      total,
    });
  } catch (error) {
    return handleError(error);
  }
}

