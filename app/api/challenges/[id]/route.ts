import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError } from "@/lib/errors";
import { challengeInclude } from "@/lib/dto/challenge-filters.dto";

// GET /api/challenges/[id] - Get challenge details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: challengeInclude,
    });

    if (!challenge) {
      throw new NotFoundError("Challenge not found");
    }

    // Verify user is part of this challenge
    if (challenge.challengerId !== user.id && challenge.challengedId !== user.id) {
      throw new ForbiddenError("You do not have access to this challenge");
    }

    // Determine winner if both completed
    let winner = null;
    if (challenge.challengerAttempt && challenge.challengedAttempt) {
      const challengerScore = challenge.challengerAttempt.score || 0;
      const challengedScore = challenge.challengedAttempt.score || 0;

      if (challengerScore > challengedScore) {
        winner = "challenger";
      } else if (challengedScore > challengerScore) {
        winner = "challenged";
      } else {
        winner = "tie";
      }
    }

    return successResponse({
      challenge,
      winner,
      userRole: challenge.challengerId === user.id ? "challenger" : "challenged",
    });
  } catch (error) {
    return handleError(error);
  }
}

