import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { z } from "zod";

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

