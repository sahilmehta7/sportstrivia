import { prisma } from "@/lib/db";
import { challengeInclude } from "@/lib/dto/challenge-filters.dto";
import { ChallengeStatus } from "@prisma/client";

/**
 * Get challenges for user dashboard, filtering out expired challenges
 */
export async function getChallengesForUserDashboard(userId: string) {
  const now = new Date();

  const [activeChallenges, receivedChallenges, sentChallenges] = await Promise.all([
    // Active challenges (accepted, not expired)
    prisma.challenge.findMany({
      where: {
        status: ChallengeStatus.ACCEPTED,
        OR: [
          { challengerId: userId },
          { challengedId: userId },
        ],
        // Only non-expired challenges
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: challengeInclude,
      take: 50,
    }),
    // Received challenges (pending, not expired)
    prisma.challenge.findMany({
      where: {
        challengedId: userId,
        status: ChallengeStatus.PENDING,
        // Only non-expired challenges
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: challengeInclude,
      take: 50,
    }),
    // Sent challenges (pending, not expired)
    prisma.challenge.findMany({
      where: {
        challengerId: userId,
        status: ChallengeStatus.PENDING,
        // Only non-expired challenges
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: challengeInclude,
      take: 50,
    }),
  ]);

  return {
    activeChallenges,
    receivedChallenges,
    sentChallenges,
    // Provide counts for quick access
    counts: {
      active: activeChallenges.length,
      received: receivedChallenges.length,
      sent: sentChallenges.length,
    },
  };
}

/**
 * Get completed challenges for a user (for history view)
 */
export async function getCompletedChallenges(userId: string, limit = 20) {
  return prisma.challenge.findMany({
    where: {
      OR: [
        { challengerId: userId },
        { challengedId: userId },
      ],
      status: ChallengeStatus.COMPLETED,
    },
    orderBy: { updatedAt: "desc" },
    include: challengeInclude,
    take: limit,
  });
}

/**
 * Auto-decline pending challenges that have passed their expiry date
 * This can be called by a cron job or background task
 */
export async function expirePendingChallenges() {
  const now = new Date();

  // Mark expired pending challenges as declined
  const result = await prisma.challenge.updateMany({
    where: {
      status: ChallengeStatus.PENDING,
      expiresAt: {
        lte: now,
      },
    },
    data: {
      status: ChallengeStatus.DECLINED,
    },
  });

  return {
    expiredCount: result.count,
  };
}
