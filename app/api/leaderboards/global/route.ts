import { NextRequest } from "next/server";
import { handleError, successResponse } from "@/lib/errors";
import { buildGlobalLeaderboard, type LeaderboardPeriod } from "@/lib/services/leaderboard.service";
import { getCurrentUser } from "@/lib/auth-helpers";

// GET /api/leaderboards/global - Get global leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "all-time") as LeaderboardPeriod;
    const limit = parseInt(searchParams.get("limit") || "100");

    const leaderboard = await buildGlobalLeaderboard(period, limit);

    // Get current user's position if logged in
    const user = await getCurrentUser();
    let userPosition = null;

    if (user) {
      const userEntry = leaderboard.find((entry) => entry.userId === user.id);
      userPosition = userEntry?.rank || null;
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

