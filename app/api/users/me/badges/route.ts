import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { getUserBadgeProgress } from "@/lib/services/badge.service";

// GET /api/users/me/badges - Get current user's badges
export async function GET() {
  try {
    const user = await requireAuth();

    const progress = await getUserBadgeProgress(user.id);

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

