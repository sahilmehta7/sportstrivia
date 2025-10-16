import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { getDateRangeForPeriod, type LeaderboardPeriod } from "@/lib/services/leaderboard.service";
import { FriendStatus } from "@prisma/client";

// GET /api/leaderboards/friends - Get friends-only leaderboard
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "all-time") as LeaderboardPeriod;
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get user's friends
    const friendships = await prisma.friend.findMany({
      where: {
        userId: user.id,
        status: FriendStatus.ACCEPTED,
      },
      select: { friendId: true },
    });

    const friendIds = friendships.map((f) => f.friendId);
    // Include current user in the leaderboard
    const userIds = [user.id, ...friendIds];

    if (userIds.length === 0) {
      return successResponse({
        leaderboard: [],
        period,
        message: "Add friends to see their rankings!",
      });
    }

    const startDate = getDateRangeForPeriod(period);

    const whereClause: any = {
      userId: { in: userIds },
      completedAt: { not: null },
      isPracticeMode: false,
    };

    if (startDate) {
      whereClause.completedAt = {
        gte: startDate,
        not: null,
      };
    }

    // Aggregate by user
    const results = await prisma.quizAttempt.groupBy({
      by: ["userId"],
      where: whereClause,
      _sum: { totalPoints: true, score: true },
      _avg: { averageResponseTime: true },
      _count: { id: true },
      orderBy: [
        { _sum: { totalPoints: "desc" } },
        { _avg: { averageResponseTime: "asc" } },
      ],
      take: limit,
    });

    // Get user details
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        image: true,
        currentStreak: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = results.map((result, index) => {
      const userData = userMap.get(result.userId);
      return {
        userId: result.userId,
        userName: userData?.name || null,
        userImage: userData?.image || null,
        score: result._sum.score || 0,
        totalPoints: result._sum.totalPoints || 0,
        averageResponseTime: result._avg.averageResponseTime || 0,
        attempts: result._count.id,
        currentStreak: userData?.currentStreak || 0,
        rank: index + 1,
        isCurrentUser: result.userId === user.id,
      };
    });

    return successResponse({
      leaderboard,
      period,
      totalFriends: friendIds.length,
    });
  } catch (error) {
    return handleError(error);
  }
}
