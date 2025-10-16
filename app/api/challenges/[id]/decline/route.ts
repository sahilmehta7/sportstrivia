import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError, BadRequestError } from "@/lib/errors";
import { ChallengeStatus } from "@prisma/client";

// POST /api/challenges/[id]/decline - Decline challenge
export async function POST(
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

    // Only the challenged user can decline
    if (challenge.challengedId !== user.id) {
      throw new ForbiddenError("Only the challenged user can decline");
    }

    if (challenge.status !== ChallengeStatus.PENDING) {
      throw new BadRequestError("Challenge is no longer pending");
    }

    // Decline challenge (update status)
    await prisma.challenge.update({
      where: { id },
      data: { status: ChallengeStatus.DECLINED },
    });

    return successResponse({
      message: "Challenge declined",
    });
  } catch (error) {
    return handleError(error);
  }
}

