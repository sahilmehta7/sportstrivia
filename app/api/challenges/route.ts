import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError, NotFoundError } from "@/lib/errors";
import { z } from "zod";
import {
  type ChallengeListFilters,
  buildSentChallengesWhereClause,
  buildReceivedChallengesWhereClause,
  challengeInclude,
} from "@/lib/dto/challenge-filters.dto";
import { calculatePagination, buildPaginationResult } from "@/lib/dto/quiz-filters.dto";
import { ChallengeStatus, FriendStatus } from "@prisma/client";
import { createNotification } from "@/lib/services/notification.service";

const createChallengeSchema = z.object({
  challengedId: z.string().cuid(),
  quizId: z.string().cuid(),
  expiresInHours: z.number().int().min(1).max(168).default(24), // Max 7 days
});

// GET /api/challenges - List challenges (sent or received)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "received"; // sent, received, active

    const filters: ChallengeListFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      status: (searchParams.get("status") as ChallengeStatus) || undefined,
      type: type as any,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const { skip, take } = calculatePagination(filters.page!, filters.limit!);

    let where: any;

    if (type === "sent") {
      where = buildSentChallengesWhereClause(user.id, filters);
    } else if (type === "active") {
      // Active challenges where user is involved and status is ACCEPTED
      where = {
        OR: [
          { challengerId: user.id },
          { challengedId: user.id },
        ],
        status: ChallengeStatus.ACCEPTED,
      };
    } else {
      // Default: received challenges
      where = buildReceivedChallengesWhereClause(user.id, filters);
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: filters.sortOrder },
        include: challengeInclude,
      }),
      prisma.challenge.count({ where }),
    ]);

    return successResponse({
      challenges,
      pagination: buildPaginationResult(filters.page!, filters.limit!, total),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/challenges - Create new challenge
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { challengedId, quizId, expiresInHours } = createChallengeSchema.parse(body);

    // Cannot challenge yourself
    if (challengedId === user.id) {
      throw new BadRequestError("You cannot challenge yourself");
    }

    // Verify quiz exists and is published
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        status: true,
      },
    });

    if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
      throw new NotFoundError("Quiz not found or not available");
    }

    // Verify they are friends
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: challengedId, status: FriendStatus.ACCEPTED },
          { userId: challengedId, friendId: user.id, status: FriendStatus.ACCEPTED },
        ],
      },
    });

    if (!friendship) {
      throw new BadRequestError("You can only challenge your friends");
    }

    // Check for existing active challenge with same user and quiz
    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        OR: [
          { challengerId: user.id, challengedId, quizId },
          { challengerId: challengedId, challengedId: user.id, quizId },
        ],
        status: {
          in: [ChallengeStatus.PENDING, ChallengeStatus.ACCEPTED],
        },
      },
    });

    if (existingChallenge) {
      throw new BadRequestError("An active challenge already exists for this quiz");
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create challenge
    const challenge = await prisma.challenge.create({
      data: {
        challengerId: user.id,
        challengedId,
        quizId,
        status: ChallengeStatus.PENDING,
        expiresAt,
      },
      include: challengeInclude,
    });

    // Create notification for challenged user
    await createNotification(challengedId, "CHALLENGE_RECEIVED", {
      challengerId: user.id,
      challengerName: user.name || user.email,
      quizTitle: quiz.title,
      challengeId: challenge.id,
    });

    return successResponse(
      { challenge, message: "Challenge sent successfully" },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

