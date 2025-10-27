import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { isAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError } from "@/lib/errors";
import { z } from "zod";

const toggleFeaturedSchema = z.object({
  isFeatured: z.boolean(),
});

// PATCH /api/admin/quizzes/[id]/featured - Toggle featured status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    
    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      throw new ForbiddenError("Only admins can modify featured status");
    }

    const { id } = await params;
    const body = await request.json();
    const { isFeatured } = toggleFeaturedSchema.parse(body);

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    // Update featured status
    await prisma.quiz.update({
      where: { id },
      data: { isFeatured },
    });

    return successResponse({
      message: `Quiz ${isFeatured ? "added to" : "removed from"} featured`,
      isFeatured,
    });
  } catch (error) {
    return handleError(error);
  }
}
