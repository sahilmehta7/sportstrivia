import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { buildTopicLeaderboard, type LeaderboardPeriod } from "@/lib/services/leaderboard.service";

// GET /api/leaderboards/topic/[id] - Get topic-specific leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "all-time") as LeaderboardPeriod;
    const limit = parseInt(searchParams.get("limit") || "100");

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!topic) {
      throw new NotFoundError("Topic not found");
    }

    const leaderboard = await buildTopicLeaderboard(id, period, limit);

    return successResponse({
      topic,
      leaderboard,
      period,
    });
  } catch (error) {
    return handleError(error);
  }
}

