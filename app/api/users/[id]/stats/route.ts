import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { buildPerformanceAnalytics } from "@/lib/services/analytics.service";

// GET /api/users/[id]/stats - Get detailed user statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const analytics = await buildPerformanceAnalytics(id);

    // Get leaderboard positions
    const leaderboardPositions = await prisma.quizLeaderboard.findMany({
      where: { userId: id },
      orderBy: { rank: "asc" },
      take: 5,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return successResponse({
      user,
      analytics,
      leaderboardPositions,
    });
  } catch (error) {
    return handleError(error);
  }
}
