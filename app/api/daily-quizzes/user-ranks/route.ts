import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";

// GET /api/daily-quizzes/user-ranks - Get user ranks for daily quizzes
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Get quiz IDs from query params
    const { searchParams } = new URL(request.url);
    const quizIds = searchParams.get("quizIds");
    
    if (!quizIds) {
      return successResponse({});
    }

    const quizIdArray = quizIds.split(",");
    
    // Get user's ranks for these quizzes
    const userRanks = await prisma.quizLeaderboard.findMany({
      where: {
        userId: user.id,
        quizId: { in: quizIdArray },
      },
      select: {
        quizId: true,
        rank: true,
      },
    });

    // Convert to object mapping quizId -> rank
    const rankMap = userRanks.reduce((acc, item) => {
      acc[item.quizId] = item.rank;
      return acc;
    }, {} as Record<string, number>);

    return successResponse(rankMap);
  } catch (error) {
    return handleError(error);
  }
}
