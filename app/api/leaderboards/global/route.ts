import { NextRequest } from "next/server";
import { handleError, successResponse } from "@/lib/errors";
import {
  buildGlobalLeaderboard,
  getUserGlobalPosition,
  type LeaderboardPeriod,
} from "@/lib/services/leaderboard.service";
import { getCurrentUser } from "@/lib/auth-helpers";

// GET /api/leaderboards/global - Get global leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "all-time") as LeaderboardPeriod;
    const limitParam = parseInt(searchParams.get("limit") || "100", 10);
    const MAX_LIMIT = 100;
    const limit = Math.max(1, Math.min(limitParam, MAX_LIMIT));

    const leaderboard = await buildGlobalLeaderboard(period, limit);

    // Get current user's position if logged in
    const user = await getCurrentUser();
    let userPosition: number | null = null;

    if (user) {
      userPosition = await getUserGlobalPosition(user.id, period);
    }

    return successResponse({
      leaderboard,
      period,
      userPosition,
    });
  } catch (error) {
    return handleError(error);
  }
}
