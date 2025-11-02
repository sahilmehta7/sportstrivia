import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError, BadRequestError } from "@/lib/errors";
import { ChallengeStatus } from "@prisma/client";
import { createNotification } from "@/lib/services/notification.service";
import { challengeInclude } from "@/lib/dto/challenge-filters.dto";

// POST /api/challenges/[id]/accept - Accept challenge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        challenger: true,
      },
    });

    if (!challenge) {
      throw new NotFoundError("Challenge not found");
    }

    // Only the challenged user can accept
    if (challenge.challengedId !== user.id) {
      throw new ForbiddenError("Only the challenged user can accept");
    }

    if (challenge.status !== ChallengeStatus.PENDING) {
      throw new BadRequestError("Challenge is no longer pending");
    }

    // Check if challenge has expired
    if (challenge.expiresAt && challenge.expiresAt < new Date()) {
      await prisma.challenge.update({
        where: { id },
        data: { status: ChallengeStatus.EXPIRED },
      });
      throw new BadRequestError("Challenge has expired");
    }

    // Accept challenge
    const updatedChallenge = await prisma.challenge.update({
      where: { id },
      data: { status: ChallengeStatus.ACCEPTED },
      include: challengeInclude,
    });

    // Notify challenger
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

    return successResponse({
      challenge: updatedChallenge,
      message: "Challenge accepted. Start the quiz when you're ready!",
    });
  } catch (error) {
    return handleError(error);
  }
}
