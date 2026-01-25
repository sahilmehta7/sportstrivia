import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError, BadRequestError } from "@/lib/errors";
import { challengeInclude } from "@/lib/dto/challenge-filters.dto";
import { ChallengeStatus } from "@prisma/client";

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

// PATCH /api/challenges/[id] - Update challenge status (Accept/Decline)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (![ChallengeStatus.ACCEPTED, ChallengeStatus.DECLINED].includes(status)) {
      throw new BadRequestError("Invalid status. Allowed: ACCEPTED, DECLINED");
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        challenger: true,
      },
    });

    if (!challenge) {
      throw new NotFoundError("Challenge not found");
    }

    // Only the challenged user can accept/decline
    if (challenge.challengedId !== user.id) {
      throw new ForbiddenError("Only the challenged user can update status");
    }

    if (challenge.status !== ChallengeStatus.PENDING) {
      throw new BadRequestError("Challenge is no longer pending");
    }

    // Check expiration
    if (challenge.expiresAt && challenge.expiresAt < new Date()) {
      throw new BadRequestError("Challenge has expired");
    }

    // Update status
    const updatedChallenge = await prisma.challenge.update({
      where: { id },
      data: { status },
      include: challengeInclude,
    });

    // Notify challenger if accepted
    if (status === ChallengeStatus.ACCEPTED) {
      // Import dynamically if needed, or assume it's available. 
      // Note: reusing logic from accept/route.ts
      const { createNotification } = await import("@/lib/services/notification.service");
      await createNotification(
        challenge.challengerId,
        "CHALLENGE_ACCEPTED",
        {
          byUserId: user.id,
          byUserName: user.name || user.email,
          challengeId: challenge.id,
        },
        {
          push: {
            title: `${user.name || user.email} accepted your challenge`,
            body: `Jump back into ${updatedChallenge.quiz.title} to compete.`,
            url: `/challenges/${challenge.id}`,
            tag: `challenge:${challenge.id}`,
            data: {
              challengeId: challenge.id,
              quizId: updatedChallenge.quiz.id,
            },
          },
        }
      );
    }

    return successResponse({
      challenge: updatedChallenge,
      message: status === ChallengeStatus.ACCEPTED
        ? "Challenge accepted. Start the quiz when you're ready!"
        : "Challenge declined",
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
