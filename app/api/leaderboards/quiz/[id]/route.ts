import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth-helpers";

// GET /api/leaderboards/quiz/[id] - Get quiz-specific leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    // Get quiz leaderboard (already exists in QuizLeaderboard table)
    const leaderboard = await prisma.quizLeaderboard.findMany({
      where: { quizId: id },
      orderBy: [{ bestScore: "desc" }, { bestTime: "asc" }],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Get current user's position if logged in
    const user = await getCurrentUser();
    let userEntry = null;

    if (user) {
      userEntry = await prisma.quizLeaderboard.findUnique({
        where: {
          quizId_userId: {
            quizId: id,
            userId: user.id,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    }

    return successResponse({
      quiz,
      leaderboard: leaderboard.map((entry) => ({
        userId: entry.userId,
        userName: entry.user.name,
        userImage: entry.user.image,
        bestScore: entry.bestScore,
        bestTime: entry.bestTime,
        attempts: entry.attempts,
        rank: entry.rank,
      })),
      userEntry: userEntry
        ? {
            userId: userEntry.userId,
            userName: userEntry.user.name,
            userImage: userEntry.user.image,
            bestScore: userEntry.bestScore,
            bestTime: userEntry.bestTime,
            attempts: userEntry.attempts,
            rank: userEntry.rank,
          }
        : null,
    });
  } catch (error) {
    return handleError(error);
  }
}

