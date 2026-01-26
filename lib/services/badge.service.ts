import { prisma } from "@/lib/db";
import { createNotification } from "./notification.service";

/**
 * Badge types and their award criteria
 */
export const BADGE_CRITERIA = {
  EARLY_BIRD: {
    name: "Early Bird",
    description: "Complete your first quiz",
    check: async (userId: string, _context?: BadgeCheckContext) => {
      const count = await prisma.quizAttempt.count({
        where: { userId, completedAt: { not: null } },
      });
      return count >= 1;
    },
  },
  QUIZ_MASTER: {
    name: "Quiz Master",
    description: "Complete 10 quizzes",
    check: async (userId: string, _context?: BadgeCheckContext) => {
      const count = await prisma.quizAttempt.count({
        where: { userId, completedAt: { not: null } },
      });
      return count >= 10;
    },
  },
  PERFECT_SCORE: {
    name: "Perfect Round",
    description: "Achieve a perfect score on any quiz",
    check: async (userId: string, context?: BadgeCheckContext) => {
      if (context?.score === 100) return true;
      const perfectAttempt = await prisma.quizAttempt.findFirst({
        where: { userId, score: 100, completedAt: { not: null } },
      });
      return !!perfectAttempt;
    },
  },
  STREAK_WARRIOR: {
    name: "Streak Warrior",
    description: "Maintain a 7-day streak",
    check: async (userId: string, _context?: BadgeCheckContext) => {
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
    check: async (userId: string, _context?: BadgeCheckContext) => {
      const count = await prisma.friend.count({
        where: { userId, status: "ACCEPTED" },
      });
      return count >= 5;
    },
  },
  CHALLENGER: {
    name: "Challenger",
    description: "Win 5 challenges",
    check: async (userId: string, _context?: BadgeCheckContext) => {
      const challenges = await prisma.challenge.findMany({
        where: {
          OR: [
            { challengerId: userId },
            { challengedId: userId },
          ],
          status: "COMPLETED",
        },
        select: {
          challengerId: true,
          challengedId: true,
          challengerScore: true,
          challengedScore: true,
        },
      });

      let wins = 0;
      for (const challenge of challenges) {
        const userScore =
          challenge.challengerId === userId
            ? challenge.challengerScore ?? 0
            : challenge.challengedScore ?? 0;
        const opponentScore =
          challenge.challengerId === userId
            ? challenge.challengedScore ?? 0
            : challenge.challengerScore ?? 0;

        if (userScore > opponentScore) wins++;
      }

      return wins >= 5;
    },
  },
  REVIEWER: {
    name: "Reviewer",
    description: "Review 10 quizzes",
    check: async (userId: string, _context?: BadgeCheckContext) => {
      const count = await prisma.quizReview.count({
        where: { userId },
      });
      return count >= 10;
    },
  },
  SPEEDSTER: {
    name: "Lightning Fast",
    description: "Answer a question correctly in under 2 seconds",
    check: async (userId: string, _context?: BadgeCheckContext) => {
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
    check: async (userId: string, _context?: BadgeCheckContext) => {
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

      if (attempts.length === 0) return false;

      // Batch fetch all answers for all attempts (fixes N+1 query)
      const attemptIds = attempts.map((a) => a.id);
      const allAnswers = await prisma.userAnswer.findMany({
        where: { attemptId: { in: attemptIds } },
        orderBy: { createdAt: "asc" },
        select: {
          attemptId: true,
          isCorrect: true,
          wasSkipped: true,
        },
      });

      const answersByAttempt = new Map<string, typeof allAnswers>();
      for (const answer of allAnswers) {
        const existing = answersByAttempt.get(answer.attemptId) || [];
        existing.push(answer);
        answersByAttempt.set(answer.attemptId, existing);
      }

      for (const attempt of attempts) {
        const answers = answersByAttempt.get(attempt.id) || [];
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
        if (incorrectCount >= 2 && recovered) return true;
      }
      return false;
    },
  },
  // --- NEW BADGES ---
  FOOTBALL_FANATIC: {
    name: "Football Fanatic",
    description: "Complete 10 Football quizzes",
    check: async (userId: string, context?: BadgeCheckContext) => {
      if (context?.sport && context.sport !== "Football") return false;
      const count = await prisma.quizAttempt.count({
        where: {
          userId,
          completedAt: { not: null },
          quiz: { sport: "Football" }
        }
      });
      return count >= 10;
    }
  },
  CRICKET_CHAMPION: {
    name: "Cricket Champion",
    description: "Complete 10 Cricket quizzes",
    check: async (userId: string, context?: BadgeCheckContext) => {
      if (context?.sport && context.sport !== "Cricket") return false;
      const count = await prisma.quizAttempt.count({
        where: {
          userId,
          completedAt: { not: null },
          quiz: { sport: "Cricket" }
        }
      });
      return count >= 10;
    }
  },
  BASKETBALL_STAR: {
    name: "Basketball Star",
    description: "Complete 10 Basketball quizzes",
    check: async (userId: string, context?: BadgeCheckContext) => {
      if (context?.sport && context.sport !== "Basketball") return false;
      const count = await prisma.quizAttempt.count({
        where: {
          userId,
          completedAt: { not: null },
          quiz: { sport: "Basketball" }
        }
      });
      return count >= 10;
    }
  },
  TENNIS_ACE: {
    name: "Tennis Ace",
    description: "Complete 10 Tennis quizzes",
    check: async (userId: string, context?: BadgeCheckContext) => {
      if (context?.sport && context.sport !== "Tennis") return false;
      const count = await prisma.quizAttempt.count({
        where: {
          userId,
          completedAt: { not: null },
          quiz: { sport: "Tennis" }
        }
      });
      return count >= 10;
    }
  },
  HISTORY_BUFF: {
    name: "History Buff",
    description: "Answer 50 History questions correctly",
    check: async (userId: string, _context?: BadgeCheckContext) => {
      // Check user topic stats for any topic with "History" in the name
      const stats = await prisma.userTopicStats.aggregate({
        where: {
          userId,
          topic: { name: { contains: "History", mode: "insensitive" } }
        },
        _sum: { questionsCorrect: true }
      });
      return (stats._sum.questionsCorrect || 0) >= 50;
    }
  },
  STATS_SAVANT: {
    name: "Stats Savant",
    description: "Answer 50 questions correctly in Stats topics",
    check: async (userId: string, _context?: BadgeCheckContext) => {
      const stats = await prisma.userTopicStats.aggregate({
        where: {
          userId,
          topic: { name: { contains: "Stats", mode: "insensitive" } }
        },
        _sum: { questionsCorrect: true }
      });
      return (stats._sum.questionsCorrect || 0) >= 50;
    }
  },
  NIGHT_OWL: {
    name: "Night Owl",
    description: "Complete 5 quizzes between 12 AM and 4 AM",
    check: async (userId: string, _context?: BadgeCheckContext) => {
      // This is complex to query directly in Prisma efficiently without raw SQL 
      // or fetching all dates. For now, fetch last 50 attempts and check times.
      const attempts = await prisma.quizAttempt.findMany({
        where: { userId, completedAt: { not: null } },
        select: { completedAt: true },
        orderBy: { completedAt: 'desc' },
        take: 50
      });

      let count = 0;
      for (const attempt of attempts) {
        if (!attempt.completedAt) continue;
        const hour = attempt.completedAt.getHours(); // Local timezone issues may apply, usually UTC on server
        // Assuming user is in similar timezone or we accept UTC 0-4
        if (hour >= 0 && hour < 4) count++;
      }
      return count >= 5;
    }
  },
  EARLY_RISER: {
    name: "Early Riser",
    description: "Complete 5 quizzes between 5 AM and 8 AM",
    check: async (userId: string, _context?: BadgeCheckContext) => {
      const attempts = await prisma.quizAttempt.findMany({
        where: { userId, completedAt: { not: null } },
        select: { completedAt: true },
        orderBy: { completedAt: 'desc' },
        take: 50
      });

      let count = 0;
      for (const attempt of attempts) {
        if (!attempt.completedAt) continue;
        const hour = attempt.completedAt.getHours();
        if (hour >= 5 && hour < 8) count++;
      }
      return count >= 5;
    }
  },
  WEEKEND_WARRIOR: {
    name: "Weekend Warrior",
    description: "Complete quizzes on 4 consecutive weekends",
    check: async (userId: string, _context?: BadgeCheckContext) => {
      // Simplified check: Just check total weekend quizzes for now to avoid complex date logic
      // or check 10 quizzes on weekends
      // Correct implementation of consecutive weekends is hard without extensive history
      // Let's pivot to "20 Quizzes on Weekends" for simplicity and performance
      const attempts = await prisma.quizAttempt.findMany({
        where: { userId, completedAt: { not: null } },
        select: { completedAt: true },
      });

      let weekendCount = 0;
      for (const attempt of attempts) {
        if (!attempt.completedAt) continue;
        const day = attempt.completedAt.getDay();
        if (day === 0 || day === 6) weekendCount++;
      }
      return weekendCount >= 20;
    }
  }
};

/**
 * Check and award badges to a user
 */
export interface BadgeCheckContext {
  quizId?: string;
  topicId?: string;
  sport?: string;
  score?: number;
  isPracticeMode?: boolean;
}

/**
 * Check and award badges to a user
 */
export async function checkAndAwardBadges(
  userId: string,
  context: BadgeCheckContext = {}
): Promise<string[]> {
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

    // Find criteria by matching name property
    const criteria = Object.values(BADGE_CRITERIA).find((c) => c.name === badge.name);
    if (!criteria) continue;

    // Optimization: Skip checks that require specific context if context is missing
    // For example, don't check "Total Quizzes" on every single action if we can help it, 
    // but usually these checks are fast enough. 
    // We can add specific skips here if needed in the future.

    // Check if user meets criteria
    const shouldAward = await criteria.check(userId, context);

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
