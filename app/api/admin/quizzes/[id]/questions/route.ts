import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { syncTopicsFromQuestionPool } from "@/lib/services/quiz-topic-sync.service";
import { z } from "zod";

const addQuestionSchema = z.object({
  questionId: z.string().cuid(),
  order: z.number().int().optional(),
  points: z.number().int().min(1).default(1),
});

const updateOrderSchema = z.object({
  questions: z.array(z.object({
    questionId: z.string().cuid(),
    order: z.number().int(),
    points: z.number().int().min(1).default(1),
  })),
});

// GET /api/admin/quizzes/[id]/questions - Get questions in quiz pool
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    // Get questions in quiz pool
    const questionPool = await prisma.quizQuestionPool.findMany({
      where: { quizId: id },
      include: {
        question: {
          include: {
            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            answers: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    return successResponse({
      quiz,
      questions: questionPool.map((qp) => ({
        poolId: qp.id,
        questionId: qp.questionId,
        order: qp.order,
        points: qp.points,
        question: qp.question,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/quizzes/[id]/questions - Add question to quiz
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { questionId, order, points } = addQuestionSchema.parse(body);

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    // Check if question is already in quiz
    const existing = await prisma.quizQuestionPool.findUnique({
      where: {
        quizId_questionId: {
          quizId: id,
          questionId,
        },
      },
    });

    if (existing) {
      throw new Error("Question is already in this quiz");
    }

    // Get max order if not specified
    let finalOrder = order;
    if (finalOrder === undefined) {
      const maxOrderEntry = await prisma.quizQuestionPool.findFirst({
        where: { quizId: id },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      finalOrder = (maxOrderEntry?.order || 0) + 1;
    }

    // Add question to quiz pool
    const poolEntry = await prisma.quizQuestionPool.create({
      data: {
        quizId: id,
        questionId,
        order: finalOrder,
        points,
      },
      include: {
        question: {
          include: {
            topic: true,
            answers: true,
          },
        },
      },
    });

    // Sync topics from question pool
    try {
      await syncTopicsFromQuestionPool(id);
    } catch (error) {
      console.error("Failed to sync topics after adding question:", error);
    }

    return successResponse(poolEntry, 201);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/quizzes/[id]/questions - Update question order/points
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { questions } = updateOrderSchema.parse(body);

    // Update all questions in a transaction
    await prisma.$transaction(async (tx) => {
      for (const q of questions) {
        await tx.quizQuestionPool.updateMany({
          where: {
            quizId: id,
            questionId: q.questionId,
          },
          data: {
            order: q.order,
            points: q.points,
          },
        });
      }
    });

    return successResponse({ message: "Question order updated successfully" });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/quizzes/[id]/questions - Remove question from quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      throw new Error("Question ID is required");
    }

    // Remove question from quiz pool
    const deleted = await prisma.quizQuestionPool.deleteMany({
      where: {
        quizId: id,
        questionId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundError("Question not found in quiz pool");
    }

    // Sync topics from question pool
    try {
      await syncTopicsFromQuestionPool(id);
    } catch (error) {
      console.error("Failed to sync topics after removing question:", error);
    }

    return successResponse({ message: "Question removed from quiz" });
  } catch (error) {
    return handleError(error);
  }
}

