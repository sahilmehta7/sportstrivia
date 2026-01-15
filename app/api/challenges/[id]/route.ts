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
    if (challenge.challengerScore !== null && challenge.challengedScore !== null) {
      const challengerScore = challenge.challengerScore || 0;
      const challengedScore = challenge.challengedScore || 0;

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

// DELETE /api/challenges/[id] - Cancel challenge (only challenger can cancel pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
    });

    if (!challenge) {
      throw new NotFoundError("Challenge not found");
    }

    // Only the challenger can cancel, and only pending challenges
    if (challenge.challengerId !== user.id) {
      throw new ForbiddenError("Only the challenger can cancel this challenge");
    }

    if (challenge.status !== "PENDING") {
      throw new ForbiddenError("Only pending challenges can be cancelled");
    }

    await prisma.challenge.delete({
      where: { id },
    });

    return successResponse({ message: "Challenge cancelled successfully" });
  } catch (error) {
    return handleError(error);
  }
}
