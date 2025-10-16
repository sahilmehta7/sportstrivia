import { prisma } from "@/lib/db";
import { createNotification } from "./notification.service";

/**
 * Badge types and their award criteria
 */
export const BADGE_CRITERIA = {
  EARLY_BIRD: {
    name: "Early Bird",
    description: "Complete your first quiz",
    check: async (userId: string) => {
      const count = await prisma.quizAttempt.count({
        where: { userId, completedAt: { not: null } },
      });
      return count >= 1;
    },
  },
  QUIZ_MASTER: {
    name: "Quiz Master",
    description: "Complete 10 quizzes",
    check: async (userId: string) => {
      const count = await prisma.quizAttempt.count({
        where: { userId, completedAt: { not: null } },
      });
      return count >= 10;
    },
  },
  PERFECT_SCORE: {
    name: "Perfect Round",
    description: "Achieve a perfect score on any quiz",
    check: async (userId: string) => {
      const perfectAttempt = await prisma.quizAttempt.findFirst({
        where: { userId, score: 100, completedAt: { not: null } },
      });
      return !!perfectAttempt;
    },
  },
  STREAK_WARRIOR: {
    name: "Streak Warrior",
    description: "Maintain a 7-day streak",
    check: async (userId: string) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true },
      });
      return (user?.currentStreak || 0) >= 7;
    },
  },
  SOCIAL_BUTTERFLY: {
    name: "Social Butterfly",
    description: "Add 5 friends",
    check: async (userId: string) => {
      const count = await prisma.friend.count({
        where: { userId, status: "ACCEPTED" },
      });
      return count >= 5;
    },
  },
  CHALLENGER: {
    name: "Challenger",
    description: "Win 5 challenges",
    check: async (userId: string) => {
      const challenges = await prisma.challenge.findMany({
        where: {
          OR: [
            { challengerId: userId },
            { challengedId: userId },
          ],
          status: "COMPLETED",
        },
        include: {
          challengerAttempt: { select: { score: true } },
          challengedAttempt: { select: { score: true } },
        },
      });

      let wins = 0;
      for (const challenge of challenges) {
        const userScore =
          challenge.challengerId === userId
            ? challenge.challengerAttempt?.score || 0
            : challenge.challengedAttempt?.score || 0;
        const opponentScore =
          challenge.challengerId === userId
            ? challenge.challengedAttempt?.score || 0
            : challenge.challengerAttempt?.score || 0;

        if (userScore > opponentScore) wins++;
      }

      return wins >= 5;
    },
  },
  REVIEWER: {
    name: "Reviewer",
    description: "Review 10 quizzes",
    check: async (userId: string) => {
      const count = await prisma.quizReview.count({
        where: { userId },
      });
      return count >= 10;
    },
  },
  SPEEDSTER: {
    name: "Lightning Fast",
    description: "Answer a question correctly in under 2 seconds",
    check: async (userId: string) => {
      const fastAnswer = await prisma.userAnswer.findFirst({
        where: {
          attempt: {
            userId,
            completedAt: { not: null },
            isPracticeMode: false,
          },
          isCorrect: true,
          wasSkipped: false,
          timeSpent: { lte: 2 },
        },
      });
      return !!fastAnswer;
    },
  },
  COMEBACK_KID: {
    name: "Comeback Kid",
    description: "Recover from two incorrect answers and still pass a quiz",
    check: async (userId: string) => {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          userId,
          isPracticeMode: false,
          completedAt: { not: null },
          passed: true,
        },
        orderBy: { completedAt: "desc" },
        take: 5,
        select: { id: true },
      });

      for (const attempt of attempts) {
        const answers = await prisma.userAnswer.findMany({
          where: { attemptId: attempt.id },
          orderBy: { createdAt: "asc" },
          select: { isCorrect: true, wasSkipped: true },
        });

        let incorrectCount = 0;
        let recovered = false;

        for (let i = 0; i < answers.length; i++) {
          const answer = answers[i];
          if (!answer.isCorrect && !answer.wasSkipped) {
            incorrectCount++;
          }

          if (incorrectCount >= 2) {
            const remaining = answers.slice(i + 1);
            if (remaining.some((ans) => ans.isCorrect && !ans.wasSkipped)) {
              recovered = true;
              break;
            }
          }
        }

        if (incorrectCount >= 2 && recovered) {
          return true;
        }
      }

      return false;
    },
  },
};

/**
 * Check and award badges to a user
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awardedBadges: string[] = [];

  // Get all badges
  const allBadges = await prisma.badge.findMany();

  // Get user's existing badges
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  // Check each badge
  for (const badge of allBadges) {
    // Skip if already earned
    if (earnedBadgeIds.has(badge.id)) continue;

    const criteria = BADGE_CRITERIA[badge.name as keyof typeof BADGE_CRITERIA];
    if (!criteria) continue;

    // Check if user meets criteria
    const shouldAward = await criteria.check(userId);

    if (shouldAward) {
      // Award badge
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });

      awardedBadges.push(criteria?.name ?? badge.name);

      // Create notification
      await createNotification(userId, "BADGE_EARNED", {
        badgeName: badge.name,
        badgeDescription: badge.description,
      });
    }
  }

  return awardedBadges;
}

/**
 * Get user's badge progress
 */
export async function getUserBadgeProgress(userId: string) {
  const allBadges = await prisma.badge.findMany();
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
  });

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  const progress = await Promise.all(
    allBadges.map(async (badge) => {
      const earned = earnedBadgeIds.has(badge.id);
      return {
        badge,
        earned,
        earnedAt: userBadges.find((ub) => ub.badgeId === badge.id)?.earnedAt || null,
        // Could add progress percentage here if needed
      };
    })
  );

  return progress;
}
