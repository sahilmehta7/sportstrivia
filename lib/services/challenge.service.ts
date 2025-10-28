import { prisma } from "@/lib/db";
import { challengeInclude } from "@/lib/dto/challenge-filters.dto";
import { ChallengeStatus } from "@prisma/client";

export async function getChallengesForUserDashboard(userId: string) {
  const [activeChallenges, receivedChallenges, sentChallenges] = await Promise.all([
    prisma.challenge.findMany({
      where: {
        status: ChallengeStatus.ACCEPTED,
        OR: [
          { challengerId: userId },
          { challengedId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: challengeInclude,
      take: 50,
    }),
    prisma.challenge.findMany({
      where: {
        challengedId: userId,
        status: ChallengeStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
      include: challengeInclude,
      take: 50,
    }),
    prisma.challenge.findMany({
      where: {
        challengerId: userId,
        status: ChallengeStatus.PENDING,
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
  };
}

