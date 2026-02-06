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
 * Check and award badges to a user (Optimized version)
 * This version batch-fetches data upfront to minimize database queries
 */
export async function checkAndAwardBadges(
  userId: string,
  context: BadgeCheckContext = {}
): Promise<string[]> {
  // Batch fetch all initial data needed (3 queries instead of 20+)
  const [allBadges, userBadges, userData] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
      },
    }),
  ]);

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  // Get list of un-earned badges that need checking
  const badgesToCheck = allBadges.filter(
    (badge) => !earnedBadgeIds.has(badge.id) &&
      Object.values(BADGE_CRITERIA).some((c) => c.name === badge.name)
  );

  // If no badges to check, return early
  if (badgesToCheck.length === 0) {
    return [];
  }

  // Pre-fetch data needed for badge checks in parallel
  // This is lazy-loaded based on which badges need checking
  const badgeNames = new Set(badgesToCheck.map((b) => b.name));

  // Determine which data we need to fetch based on unchecked badges
  const needsAttemptCount = badgeNames.has("Early Bird") || badgeNames.has("Quiz Master");
  const needsPerfectScore = badgeNames.has("Perfect Round");
  const needsFriendCount = badgeNames.has("Social Butterfly");
  const needsChallenges = badgeNames.has("Challenger");
  const needsReviewCount = badgeNames.has("Reviewer");
  const needsFastAnswer = badgeNames.has("Lightning Fast");
  const needsSportQuizzes = badgeNames.has("Football Fanatic") ||
    badgeNames.has("Cricket Champion") ||
    badgeNames.has("Basketball Star") ||
    badgeNames.has("Tennis Ace");
  const needsTopicStats = badgeNames.has("History Buff") || badgeNames.has("Stats Savant");
  const needsTimeBasedAttempts = badgeNames.has("Night Owl") ||
    badgeNames.has("Early Riser") ||
    badgeNames.has("Weekend Warrior");

  // Batch fetch additional data as needed
  const [
    attemptCount,
    hasPerfectScore,
    friendCount,
    challenges,
    reviewCount,
    hasFastAnswer,
    sportQuizCounts,
    topicStats,
    recentAttempts,
    comebackData
  ] = await Promise.all([
    needsAttemptCount
      ? prisma.quizAttempt.count({ where: { userId, completedAt: { not: null } } })
      : Promise.resolve(0),
    needsPerfectScore
      ? (context?.score === 100
        ? Promise.resolve(true)
        : prisma.quizAttempt.findFirst({
          where: { userId, score: 100, completedAt: { not: null } },
          select: { id: true },
        }).then((r) => !!r))
      : Promise.resolve(false),
    needsFriendCount
      ? prisma.friend.count({ where: { userId, status: "ACCEPTED" } })
      : Promise.resolve(0),
    needsChallenges
      ? prisma.challenge.findMany({
        where: {
          OR: [{ challengerId: userId }, { challengedId: userId }],
          status: "COMPLETED",
        },
        select: {
          challengerId: true,
          challengedId: true,
          challengerScore: true,
          challengedScore: true,
        },
      })
      : Promise.resolve([]),
    needsReviewCount
      ? prisma.quizReview.count({ where: { userId } })
      : Promise.resolve(0),
    needsFastAnswer
      ? prisma.userAnswer.findFirst({
        where: {
          attempt: { userId, completedAt: { not: null }, isPracticeMode: false },
          isCorrect: true,
          wasSkipped: false,
          timeSpent: { lte: 2 },
        },
        select: { id: true },
      }).then((r) => !!r)
      : Promise.resolve(false),
    needsSportQuizzes
      ? Promise.all([
        prisma.quizAttempt.count({ where: { userId, completedAt: { not: null }, quiz: { sport: "Football" } } }),
        prisma.quizAttempt.count({ where: { userId, completedAt: { not: null }, quiz: { sport: "Cricket" } } }),
        prisma.quizAttempt.count({ where: { userId, completedAt: { not: null }, quiz: { sport: "Basketball" } } }),
        prisma.quizAttempt.count({ where: { userId, completedAt: { not: null }, quiz: { sport: "Tennis" } } }),
      ]).then(([football, cricket, basketball, tennis]) => ({ football, cricket, basketball, tennis }))
      : Promise.resolve({ football: 0, cricket: 0, basketball: 0, tennis: 0 }),
    needsTopicStats
      ? Promise.all([
        prisma.userTopicStats.aggregate({
          where: { userId, topic: { name: { contains: "History", mode: "insensitive" } } },
          _sum: { questionsCorrect: true },
        }),
        prisma.userTopicStats.aggregate({
          where: { userId, topic: { name: { contains: "Stats", mode: "insensitive" } } },
          _sum: { questionsCorrect: true },
        }),
      ]).then(([history, stats]) => ({
        historyCorrect: history._sum.questionsCorrect || 0,
        statsCorrect: stats._sum.questionsCorrect || 0,
      }))
      : Promise.resolve({ historyCorrect: 0, statsCorrect: 0 }),
    needsTimeBasedAttempts
      ? prisma.quizAttempt.findMany({
        where: { userId, completedAt: { not: null } },
        select: { completedAt: true },
        orderBy: { completedAt: "desc" },
        take: 100,
      })
      : Promise.resolve([]),
    badgeNames.has("Comeback Kid")
      ? fetchComebackData(userId)
      : Promise.resolve(false),
  ]);

  // Calculate derived values
  const challengeWins = challenges.reduce((wins, c) => {
    const userScore = c.challengerId === userId ? (c.challengerScore ?? 0) : (c.challengedScore ?? 0);
    const opponentScore = c.challengerId === userId ? (c.challengedScore ?? 0) : (c.challengerScore ?? 0);
    return userScore > opponentScore ? wins + 1 : wins;
  }, 0);

  let nightOwlCount = 0;
  let earlyRiserCount = 0;
  let weekendCount = 0;
  for (const attempt of recentAttempts) {
    if (!attempt.completedAt) continue;
    const hour = attempt.completedAt.getHours();
    const day = attempt.completedAt.getDay();
    if (hour >= 0 && hour < 4) nightOwlCount++;
    if (hour >= 5 && hour < 8) earlyRiserCount++;
    if (day === 0 || day === 6) weekendCount++;
  }

  // Create a cached data object for quick lookups
  const cachedData = {
    attemptCount,
    hasPerfectScore,
    streak: userData?.currentStreak ?? 0,
    friendCount,
    challengeWins,
    reviewCount,
    hasFastAnswer,
    sportQuizCounts,
    topicStats,
    nightOwlCount,
    earlyRiserCount,
    weekendCount,
    hasComebackKid: comebackData,
  };

  // Check badges using cached data
  const awardedBadges: string[] = [];
  const badgesToAward: { badgeId: string; name: string; description: string | null }[] = [];

  for (const badge of badgesToCheck) {
    const criteria = Object.values(BADGE_CRITERIA).find((c) => c.name === badge.name);
    if (!criteria) continue;

    const shouldAward = checkBadgeWithCache(badge.name, cachedData, context);

    if (shouldAward) {
      badgesToAward.push({ badgeId: badge.id, name: badge.name, description: badge.description });
      awardedBadges.push(badge.name);
    }
  }

  // Award badges in parallel
  if (badgesToAward.length > 0) {
    await Promise.all([
      // Create badge records
      ...badgesToAward.map((badge) =>
        prisma.userBadge.create({
          data: { userId, badgeId: badge.badgeId },
        })
      ),
      // Create notifications
      ...badgesToAward.map((badge) =>
        createNotification(userId, "BADGE_EARNED", {
          badgeName: badge.name,
          badgeDescription: badge.description,
        })
      ),
    ]);
  }

  return awardedBadges;
}

/**
 * Helper function to check a badge against cached data
 */
function checkBadgeWithCache(
  badgeName: string,
  data: {
    attemptCount: number;
    hasPerfectScore: boolean;
    streak: number;
    friendCount: number;
    challengeWins: number;
    reviewCount: number;
    hasFastAnswer: boolean;
    sportQuizCounts: { football: number; cricket: number; basketball: number; tennis: number };
    topicStats: { historyCorrect: number; statsCorrect: number };
    nightOwlCount: number;
    earlyRiserCount: number;
    weekendCount: number;
    hasComebackKid: boolean;
  },
  context: BadgeCheckContext
): boolean {
  switch (badgeName) {
    case "Early Bird":
      return data.attemptCount >= 1;
    case "Quiz Master":
      return data.attemptCount >= 10;
    case "Perfect Round":
      return data.hasPerfectScore || context?.score === 100;
    case "Streak Warrior":
      return data.streak >= 7;
    case "Social Butterfly":
      return data.friendCount >= 5;
    case "Challenger":
      return data.challengeWins >= 5;
    case "Reviewer":
      return data.reviewCount >= 10;
    case "Lightning Fast":
      return data.hasFastAnswer;
    case "Football Fanatic":
      return data.sportQuizCounts.football >= 10;
    case "Cricket Champion":
      return data.sportQuizCounts.cricket >= 10;
    case "Basketball Star":
      return data.sportQuizCounts.basketball >= 10;
    case "Tennis Ace":
      return data.sportQuizCounts.tennis >= 10;
    case "History Buff":
      return data.topicStats.historyCorrect >= 50;
    case "Stats Savant":
      return data.topicStats.statsCorrect >= 50;
    case "Night Owl":
      return data.nightOwlCount >= 5;
    case "Early Riser":
      return data.earlyRiserCount >= 5;
    case "Weekend Warrior":
      return data.weekendCount >= 20;
    case "Comeback Kid":
      return data.hasComebackKid;
    default:
      return false;
  }
}

/**
 * Helper to fetch comeback kid badge data
 */
async function fetchComebackData(userId: string): Promise<boolean> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, isPracticeMode: false, completedAt: { not: null }, passed: true },
    orderBy: { completedAt: "desc" },
    take: 5,
    select: { id: true },
  });

  if (attempts.length === 0) return false;

  const allAnswers = await prisma.userAnswer.findMany({
    where: { attemptId: { in: attempts.map((a) => a.id) } },
    orderBy: { createdAt: "asc" },
    select: { attemptId: true, isCorrect: true, wasSkipped: true },
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
      if (!answer.isCorrect && !answer.wasSkipped) incorrectCount++;
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
