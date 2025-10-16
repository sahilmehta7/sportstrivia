import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { getUserBadgeProgress } from "@/lib/services/badge.service";

// GET /api/users/[id]/badges - Get user's badges
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const progress = await getUserBadgeProgress(id);

    const earnedBadges = progress.filter((p) => p.earned);
    const availableBadges = progress.filter((p) => !p.earned);

    return successResponse({
      earnedBadges,
      availableBadges,
      totalEarned: earnedBadges.length,
      totalAvailable: progress.length,
    });
  } catch (error) {
    return handleError(error);
  }
}

