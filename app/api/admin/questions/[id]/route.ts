import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { questionUpdateSchema } from "@/lib/validations/question.schema";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";

// GET /api/admin/questions/[id] - Get single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        topic: true,
        answers: {
          orderBy: { displayOrder: "asc" },
        },
        quizPools: {
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    return successResponse(question);
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/questions/[id] - Update question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const validatedData = questionUpdateSchema.parse(body);

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      include: { answers: true },
    });

    if (!existingQuestion) {
      throw new NotFoundError("Question not found");
    }

    // Update question and answers in a transaction
    const question = await prisma.$transaction(async (tx) => {
      // Update question
      const updatedQuestion = await tx.question.update({
        where: { id },
        data: {
          type: validatedData.type,
          topicId: validatedData.topicId,
          difficulty: validatedData.difficulty,
          questionText: validatedData.questionText,
          questionImageUrl: validatedData.questionImageUrl,
          questionVideoUrl: validatedData.questionVideoUrl,
          questionAudioUrl: validatedData.questionAudioUrl,
          hint: validatedData.hint,
          explanation: validatedData.explanation,
          explanationImageUrl: validatedData.explanationImageUrl,
          explanationVideoUrl: validatedData.explanationVideoUrl,
          randomizeAnswerOrder: validatedData.randomizeAnswerOrder,
          timeLimit: validatedData.timeLimit,
        },
      });

      // Update answers if provided
      if (validatedData.answers) {
        // Delete existing answers
        await tx.answer.deleteMany({
          where: { questionId: id },
        });

        // Create new answers
        await tx.answer.createMany({
          data: validatedData.answers.map((answer) => ({
            questionId: id,
            answerText: answer.answerText || "",
            answerImageUrl: answer.answerImageUrl,
            answerVideoUrl: answer.answerVideoUrl,
            answerAudioUrl: answer.answerAudioUrl,
            isCorrect: answer.isCorrect || false,
            displayOrder: answer.displayOrder || 0,
          })),
        });
      }

      // Return updated question with answers
      return await tx.question.findUnique({
        where: { id },
        include: {
          topic: true,
          answers: {
            orderBy: { displayOrder: "asc" },
          },
        },
      });
    });

    return successResponse(question);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/questions/[id] - Delete question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quizPools: true,
            userAnswers: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    // Check if question is used in any quizzes
    if (question._count.quizPools > 0) {
      return successResponse(
        {
          message: `Cannot delete question. It is used in ${question._count.quizPools} quiz(es).`,
          canDelete: false,
        },
        400
      );
    }

    // Delete question (answers will be cascade deleted)
    await prisma.question.delete({
      where: { id },
    });

    return successResponse({ message: "Question deleted successfully" });
  } catch (error) {
    return handleError(error);
  }
}

