import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { z } from "zod";

const submitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  answerId: z.string().cuid().nullable(),
  timeSpent: z.number().int().min(0),
});

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
      throw new Error("Unauthorized");
    }

    // Check if attempt is already completed
    if (attempt.completedAt) {
      throw new Error("Quiz attempt already completed");
    }

    if (!attempt.selectedQuestionIds.includes(questionId)) {
      throw new BadRequestError("Question not part of this quiz attempt");
    }

    // Check if answer already exists for this question
    const existingAnswer = await prisma.userAnswer.findFirst({
      where: {
        attemptId: id,
        questionId,
      },
    });

    if (existingAnswer) {
      throw new Error("Answer already submitted for this question");
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

    // Update question statistics
    await prisma.question.update({
      where: { id: questionId },
      data: {
        timesAnswered: { increment: 1 },
        ...(isCorrect && { timesCorrect: { increment: 1 } }),
      },
    });

    return successResponse({
      questionId,
      isCorrect,
      wasSkipped,
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
    // Ensure answers are provided in order
    const answeredCount = await prisma.userAnswer.count({
      where: { attemptId: id },
    });

    const expectedQuestionId = attempt.selectedQuestionIds[answeredCount];
    if (!expectedQuestionId) {
      throw new BadRequestError("No more questions available in this attempt");
    }

    if (expectedQuestionId !== questionId) {
      throw new BadRequestError("This question is not available yet");
    }
