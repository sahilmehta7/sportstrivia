import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError, UnauthorizedError } from "@/lib/errors";
import { z } from "zod";

const submitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  answerId: z.string().cuid().nullable(),
  timeSpent: z.number().int().min(0).max(3600),
});

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

// PUT /api/attempts/[id]/answer - Submit an answer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const { questionId, answerId, timeSpent } = submitAnswerSchema.parse(body);

    // Get attempt
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: true,
      },
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt not found");
    }

    // Verify ownership
    if (attempt.userId !== user.id) {
      throw new UnauthorizedError();
    }

    // Check if attempt is already completed
    if (attempt.completedAt) {
      throw new BadRequestError("Quiz attempt already completed");
    }

    if (!attempt.selectedQuestionIds.includes(questionId)) {
      throw new BadRequestError("Question not part of this quiz attempt");
    }

    // Check if answer already exists for this question. Treat retries as idempotent success.
    const existingAnswer = await prisma.userAnswer.findUnique({
      where: {
        attemptId_questionId: {
          attemptId: id,
          questionId,
        },
      },
    });

    if (existingAnswer) {
      return successResponse({
        questionId,
        isCorrect: existingAnswer.isCorrect,
        wasSkipped: existingAnswer.wasSkipped,
        alreadySubmitted: true,
        message: existingAnswer.wasSkipped
          ? "Question skipped"
          : existingAnswer.isCorrect
            ? "Correct answer!"
            : "Incorrect answer",
      });
    }

    // Get the correct answer
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        answers: true,
      },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const correctAnswer = question.answers.find((a) => a.isCorrect);
    const isCorrect = answerId === correctAnswer?.id;
    const wasSkipped = answerId === null;

    let created = false;
    try {
      // Create user answer
      await prisma.userAnswer.create({
        data: {
          attemptId: id,
          questionId,
          answerId,
          isCorrect,
          wasSkipped,
          timeSpent,
        },
      });
      created = true;
    } catch (error) {
      // Concurrent duplicate submission: return idempotent success.
      if (isUniqueConstraintError(error)) {
        const duplicate = await prisma.userAnswer.findUnique({
          where: {
            attemptId_questionId: {
              attemptId: id,
              questionId,
            },
          },
        });
        if (duplicate) {
          return successResponse({
            questionId,
            isCorrect: duplicate.isCorrect,
            wasSkipped: duplicate.wasSkipped,
            alreadySubmitted: true,
            message: duplicate.wasSkipped
              ? "Question skipped"
              : duplicate.isCorrect
                ? "Correct answer!"
                : "Incorrect answer",
          });
        }
      }
      throw error;
    }

    // Update question statistics only for newly created answers
    if (created) {
      await prisma.question.update({
        where: { id: questionId },
        data: {
          timesAnswered: { increment: 1 },
          ...(isCorrect && { timesCorrect: { increment: 1 } }),
        },
      });
    }

    return successResponse({
      questionId,
      isCorrect,
      wasSkipped,
      alreadySubmitted: false,
      message: wasSkipped
        ? "Question skipped"
        : isCorrect
        ? "Correct answer!"
        : "Incorrect answer",
    });
  } catch (error) {
    return handleError(error);
  }
}
