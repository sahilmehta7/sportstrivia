import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { z } from "zod";
import { prisma } from "@/lib/db";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional(),
  favoriteTeams: z.array(z.string()).optional(),
});

// GET /api/users/me - Get current user's full profile
export async function GET() {
  try {
    const authUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        _count: {
          select: {
            quizAttempts: true,
            reviews: true,
            friends: true,
            badges: true,
            topicStats: true,
          },
        },
      },
    });

    if (!user) {
      return successResponse({ user: authUser });
    }

    return successResponse({ user });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/users/me - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: validatedData,
    });

    return successResponse({
      user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/users/me - Delete current user's account
 * 
 * GDPR-compliant endpoint for users to delete their own accounts.
 * Uses cascading deletes defined in the Prisma schema to remove all related data.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // The User model has onDelete: Cascade set on most relations,
      // so deleting the user will cascade to related records
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    return successResponse({
      success: true,
      message: "Your account has been permanently deleted",
    });
  } catch (error) {
    return handleError(error);
  }
}
