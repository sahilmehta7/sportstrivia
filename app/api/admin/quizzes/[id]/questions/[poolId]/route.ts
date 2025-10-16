import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { z } from "zod";

const updatePoolQuestionSchema = z.object({
  points: z.number().int().min(0).optional(),
  order: z.number().int().optional(),
});

// DELETE /api/admin/quizzes/[id]/questions/[poolId] - Remove question from pool
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  try {
    await requireAdmin();
    const { id, poolId } = await params;

    // Verify pool entry exists and belongs to this quiz
    const poolEntry = await prisma.quizQuestionPool.findUnique({
      where: { id: poolId },
    });

    if (!poolEntry || poolEntry.quizId !== id) {
      throw new NotFoundError("Question not found in this quiz");
    }

    // Delete the pool entry
    await prisma.quizQuestionPool.delete({
      where: { id: poolId },
    });

    return successResponse({
      message: "Question removed from quiz successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/quizzes/[id]/questions/[poolId] - Update question points/order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  try {
    await requireAdmin();
    const { id, poolId } = await params;
    const body = await request.json();
    const { points, order } = updatePoolQuestionSchema.parse(body);

    // Verify pool entry exists and belongs to this quiz
    const poolEntry = await prisma.quizQuestionPool.findUnique({
      where: { id: poolId },
    });

    if (!poolEntry || poolEntry.quizId !== id) {
      throw new NotFoundError("Question not found in this quiz");
    }

    // Update the pool entry
    const updated = await prisma.quizQuestionPool.update({
      where: { id: poolId },
      data: {
        ...(points !== undefined && { points }),
        ...(order !== undefined && { order }),
      },
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
            difficulty: true,
          },
        },
      },
    });

    return successResponse({
      poolQuestion: updated,
      message: "Question updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
