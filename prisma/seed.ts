import { PrismaClient, Difficulty, QuestionType } from "@prisma/client";
import {
  LEVELS_MAX,
  TIERS_MAX,
  DEFAULT_TIER_NAMES,
  pointsForLevel,
  slugifyTierName,
} from "../lib/config/gamification";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Create admin user
  const _admin = await prisma.user.upsert({
    where: { email: "admin@sportstrivia.com" },
    update: {},
    create: {
      email: "admin@sportstrivia.com",
      name: "Admin User",
      role: "ADMIN",
    },
  });
  console.log("✓ Created admin user");

  // Create sample user
  const user = await prisma.user.upsert({
    where: { email: "user@sportstrivia.com" },
    update: {},
    create: {
      email: "user@sportstrivia.com",
      name: "Sample User",
      role: "USER",
    },
  });
  console.log("✓ Created sample user");

  // Create topics hierarchy
  const sports = await prisma.topic.upsert({
    where: { slug: "sports" },
    update: { displayEmoji: "🏅" } as any,
    create: {
      name: "Sports",
      slug: "sports",
      description: "General sports knowledge",
      displayEmoji: "🏅",
      level: 0,
    } as any,
  });

  const cricket = await prisma.topic.upsert({
    where: { slug: "cricket" },
    update: { displayEmoji: "🏏" } as any,
    create: {
      name: "Cricket",
      slug: "cricket",
      description: "Cricket trivia and facts",
      parentId: sports.id,
      displayEmoji: "🏏",
      level: 1,
    } as any,
  });

  const batting = await prisma.topic.upsert({
    where: { slug: "batting" },
    update: { displayEmoji: "🏏" } as any,
    create: {
      name: "Batting",
      slug: "batting",
      description: "Cricket batting techniques and records",
      parentId: cricket.id,
      displayEmoji: "🏏",
      level: 2,
    } as any,
  });

  const bowling = await prisma.topic.upsert({
    where: { slug: "bowling" },
    update: { displayEmoji: "🏏" } as any,
    create: {
      name: "Bowling",
      slug: "bowling",
      description: "Cricket bowling techniques and records",
      parentId: cricket.id,
      displayEmoji: "🏏",
      level: 2,
    } as any,
  });

  const basketball = await prisma.topic.upsert({
    where: { slug: "basketball" },
    update: { displayEmoji: "🏀" } as any,
    create: {
      name: "Basketball",
      slug: "basketball",
      description: "NBA and basketball trivia",
      parentId: sports.id,
      displayEmoji: "🏀",
      level: 1,
    } as any,
  });

  const _nba = await prisma.topic.upsert({
    where: { slug: "nba" },
    update: { displayEmoji: "🏀" } as any,
    create: {
      name: "NBA",
      slug: "nba",
      description: "National Basketball Association",
      parentId: basketball.id,
      displayEmoji: "🏀",
      level: 2,
    } as any,
  });

  console.log("✓ Created topic hierarchy");

  // Seed gamification Levels (curve + rounding) if not present
  const levelCount = await prisma.level.count();
  if (levelCount === 0) {
    const levelData = Array.from({ length: LEVELS_MAX }, (_, i) => {
      const level = i + 1;
      return {
        level,
        pointsRequired: pointsForLevel(level),
        isActive: true,
      };
    });
    await prisma.level.createMany({ data: levelData });
    console.log(`✓ Seeded ${LEVELS_MAX} levels`);
  } else {
    console.log("• Levels already seeded, skipping");
  }

  // Seed gamification Tiers (10-level bands) if not present
  const tierCount = await prisma.tier.count();
  if (tierCount === 0) {
    const tiersToCreate = (DEFAULT_TIER_NAMES || []).slice(0, TIERS_MAX);
    const levelsPerTier = Math.floor(LEVELS_MAX / TIERS_MAX);
    const tierData = tiersToCreate.map((name, idx) => {
      const startLevel = idx * levelsPerTier + 1;
      const endLevel = idx === TIERS_MAX - 1 ? LEVELS_MAX : (idx + 1) * levelsPerTier;
      return {
        name,
        slug: slugifyTierName(name),
        description: `${name} tier (Levels ${startLevel}-${endLevel})`,
        startLevel,
        endLevel,
        order: idx + 1,
        color: undefined,
        icon: undefined,
      } as const;
    });
    await prisma.tier.createMany({ data: tierData as any });
    console.log(`✓ Seeded ${TIERS_MAX} tiers`);
  } else {
    console.log("• Tiers already seeded, skipping");
  }

  // Create quiz tags
  const triviaTag = await prisma.quizTag.upsert({
    where: { slug: "trivia" },
    update: {},
    create: {
      name: "Trivia",
      slug: "trivia",
      description: "General trivia quizzes",
    },
  });

  const _championsTag = await prisma.quizTag.upsert({
    where: { slug: "champions" },
    update: {},
    create: {
      name: "Champions",
      slug: "champions",
      description: "Quizzes about championship winners",
    },
  });

  console.log("✓ Created quiz tags");

  // Create sample quiz
  const sampleQuiz = await prisma.quiz.upsert({
    where: { slug: "cricket-basics" },
    update: {},
    create: {
      title: "Cricket Basics Quiz",
      slug: "cricket-basics",
      description: "Test your knowledge of cricket fundamentals",
      sport: "Cricket",
      difficulty: Difficulty.EASY,
      status: "PUBLISHED",
      duration: 600,
      passingScore: 70,
      questionSelectionMode: "FIXED",
      isPublished: true,
      seoTitle: "Cricket Basics Quiz - Test Your Cricket Knowledge",
      seoDescription:
        "Challenge yourself with our cricket basics quiz. Perfect for beginners and cricket enthusiasts!",
      seoKeywords: ["cricket", "quiz", "trivia", "sports", "basics"],
    },
  });

  // Link quiz to tags
  await prisma.quizTagRelation.upsert({
    where: {
      quizId_tagId: {
        quizId: sampleQuiz.id,
        tagId: triviaTag.id,
      },
    },
    update: {},
    create: {
      quizId: sampleQuiz.id,
      tagId: triviaTag.id,
    },
  });

  console.log("✓ Created sample quiz");

  // Create sample questions
  const question1 = await prisma.question.create({
    data: {
      topicId: cricket.id,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.EASY,
      questionText: "How many players are there in a cricket team?",
      hint: "Think of a standard team size in cricket",
      explanation: "A cricket team consists of 11 players on the field at a time.",
      answers: {
        create: [
          { answerText: "11", isCorrect: true, displayOrder: 0 },
          { answerText: "10", isCorrect: false, displayOrder: 1 },
          { answerText: "12", isCorrect: false, displayOrder: 2 },
          { answerText: "9", isCorrect: false, displayOrder: 3 },
        ],
      },
    },
  });

  const question2 = await prisma.question.create({
    data: {
      topicId: batting.id,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      questionText: "What does LBW stand for in cricket?",
      hint: "It's a way a batsman can get out",
      explanation:
        "LBW stands for Leg Before Wicket, a method of dismissal in cricket.",
      answers: {
        create: [
          { answerText: "Leg Before Wicket", isCorrect: true, displayOrder: 0 },
          { answerText: "Left Behind Wicket", isCorrect: false, displayOrder: 1 },
          { answerText: "Long Ball Win", isCorrect: false, displayOrder: 2 },
          { answerText: "Late Boundary Win", isCorrect: false, displayOrder: 3 },
        ],
      },
    },
  });

  const question3 = await prisma.question.create({
    data: {
      topicId: bowling.id,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.HARD,
      questionText: "How many balls are in a standard cricket over?",
      hint: "Count the deliveries in one over",
      explanation: "A standard over in cricket consists of 6 legal deliveries.",
      answers: {
        create: [
          { answerText: "6", isCorrect: true, displayOrder: 0 },
          { answerText: "5", isCorrect: false, displayOrder: 1 },
          { answerText: "8", isCorrect: false, displayOrder: 2 },
          { answerText: "10", isCorrect: false, displayOrder: 3 },
        ],
      },
    },
  });

  // Add questions to quiz pool
  await prisma.quizQuestionPool.createMany({
    data: [
      {
        quizId: sampleQuiz.id,
        questionId: question1.id,
        order: 1,
        points: 1,
      },
      {
        quizId: sampleQuiz.id,
        questionId: question2.id,
        order: 2,
        points: 1,
      },
      {
        quizId: sampleQuiz.id,
        questionId: question3.id,
        order: 3,
        points: 2,
      },
    ],
  });

  console.log("✓ Created sample questions and added to quiz");

  // Create badges
  const _firstQuizBadge = await prisma.badge.upsert({
    where: { name: "First Quiz Complete" },
    update: {},
    create: {
      name: "First Quiz Complete",
      description: "Complete your first quiz",
      imageUrl: "/badges/first-quiz.png",
      criteria: { type: "quiz_complete", count: 1 },
    },
  });

  const _perfectScoreBadge = await prisma.badge.upsert({
    where: { name: "Perfect Round" },
    update: {},
    create: {
      name: "Perfect Round",
      description: "Achieve a perfect score on any quiz",
      imageUrl: "/badges/perfect-score.png",
      criteria: { type: "perfect_score", count: 1 },
    },
  });

  // Create remaining badges
  const _quizMasterBadge = await prisma.badge.upsert({
    where: { name: "Quiz Master" },
    update: {},
    create: {
      name: "Quiz Master",
      description: "Complete 10 quizzes",
      imageUrl: "/badges/quiz-master.png",
      criteria: { type: "quiz_complete", count: 10 },
    },
  });

  const earlyBirdBadge = await prisma.badge.upsert({
    where: { name: "Early Bird" },
    update: {},
    create: {
      name: "Early Bird",
      description: "Complete your first quiz",
      imageUrl: "/badges/early-bird.png",
      criteria: { type: "first_quiz", count: 1 },
    },
  });

  const streakWarriorBadge = await prisma.badge.upsert({
    where: { name: "Streak Warrior" },
    update: {},
    create: {
      name: "Streak Warrior",
      description: "Maintain a 7-day streak",
      imageUrl: "/badges/streak-warrior.png",
      criteria: { type: "streak", count: 7 },
    },
  });

  const socialButterflyBadge = await prisma.badge.upsert({
    where: { name: "Social Butterfly" },
    update: {},
    create: {
      name: "Social Butterfly",
      description: "Add 5 friends",
      imageUrl: "/badges/social-butterfly.png",
      criteria: { type: "friends", count: 5 },
    },
  });

  const _challengerBadge = await prisma.badge.upsert({
    where: { name: "Challenger" },
    update: {},
    create: {
      name: "Challenger",
      description: "Win 5 challenges",
      imageUrl: "/badges/challenger.png",
      criteria: { type: "challenge_wins", count: 5 },
    },
  });

  const _reviewerBadge = await prisma.badge.upsert({
    where: { name: "Reviewer" },
    update: {},
    create: {
      name: "Reviewer",
      description: "Review 10 quizzes",
      imageUrl: "/badges/reviewer.png",
      criteria: { type: "reviews", count: 10 },
    },
  });

  const _lightningFastBadge = await prisma.badge.upsert({
    where: { name: "Lightning Fast" },
    update: {},
    create: {
      name: "Lightning Fast",
      description: "Answer a question correctly in under 2 seconds",
      imageUrl: "/badges/lightning-fast.png",
      criteria: { type: "fast_answer", seconds: 2 },
    },
  });

  const _comebackKidBadge = await prisma.badge.upsert({
    where: { name: "Comeback Kid" },
    update: {},
    create: {
      name: "Comeback Kid",
      description: "Recover from two incorrect answers and still pass a quiz",
      imageUrl: "/badges/comeback-kid.png",
      criteria: { type: "comeback", minIncorrect: 2 },
    },
  });

  console.log("✓ Created badges");

  // Create additional users for testing
  const user2 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      name: "John Doe",
      bio: "Cricket enthusiast and trivia lover",
      role: "USER",
      currentStreak: 5,
      longestStreak: 12,
      favoriteTeams: ["Mumbai Indians", "India National Team"],
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      email: "jane@example.com",
      name: "Jane Smith",
      bio: "Sports trivia champion",
      role: "USER",
      currentStreak: 3,
      longestStreak: 8,
      favoriteTeams: ["Lakers", "Patriots"],
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "mod@sportstrivia.com" },
    update: {},
    create: {
      email: "mod@sportstrivia.com",
      name: "Moderator Mike",
      bio: "Keeping quizzes fair and fun",
      role: "USER",
      currentStreak: 10,
      longestStreak: 15,
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: "sarah@example.com" },
    update: {},
    create: {
      email: "sarah@example.com",
      name: "Sarah Wilson",
      role: "USER",
      currentStreak: 0,
      longestStreak: 3,
    },
  });

  console.log("✓ Created additional users");

  // Create friend relationships
  await prisma.friend.createMany({
    data: [
      // Accepted friendships
      { userId: user.id, friendId: user2.id, status: "ACCEPTED" },
      { userId: user.id, friendId: user3.id, status: "ACCEPTED" },
      { userId: user2.id, friendId: user3.id, status: "ACCEPTED" },
      { userId: moderator.id, friendId: user2.id, status: "ACCEPTED" },
      // Pending requests
      { userId: user3.id, friendId: moderator.id, status: "PENDING" },
      { userId: user4.id, friendId: user.id, status: "PENDING" },
    ],
    skipDuplicates: true,
  });

  console.log("✓ Created friend relationships");

  // Award badges to users
  await prisma.userBadge.createMany({
    data: [
      { userId: user.id, badgeId: earlyBirdBadge.id },
      { userId: user2.id, badgeId: earlyBirdBadge.id },
      { userId: user2.id, badgeId: streakWarriorBadge.id },
      { userId: moderator.id, badgeId: earlyBirdBadge.id },
      { userId: moderator.id, badgeId: streakWarriorBadge.id },
      { userId: moderator.id, badgeId: socialButterflyBadge.id },
    ],
    skipDuplicates: true,
  });

  console.log("✓ Awarded badges to users");

  // Create quiz attempts for users

  // User attempts
  const _userAttempt1 = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      quizId: sampleQuiz.id,
      selectedQuestionIds: [question1.id, question2.id, question3.id],
      totalQuestions: 3,
      score: 100,
      correctAnswers: 3,
      passed: true,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  // User2 attempts
  const _user2Attempt1 = await prisma.quizAttempt.create({
    data: {
      userId: user2.id,
      quizId: sampleQuiz.id,
      selectedQuestionIds: [question1.id, question2.id, question3.id],
      totalQuestions: 3,
      score: 66.67,
      correctAnswers: 2,
      passed: false,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  // User3 attempts
  const _user3Attempt1 = await prisma.quizAttempt.create({
    data: {
      userId: user3.id,
      quizId: sampleQuiz.id,
      selectedQuestionIds: [question1.id, question2.id, question3.id],
      totalQuestions: 3,
      score: 85.5,
      correctAnswers: 2,
      passed: true,
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  console.log("✓ Created quiz attempts");

  // Update leaderboard
  await prisma.quizLeaderboard.createMany({
    data: [
      {
        quizId: sampleQuiz.id,
        userId: user.id,
        bestScore: 100,
        bestTime: 180,
        attempts: 1,
        rank: 1,
      },
      {
        quizId: sampleQuiz.id,
        userId: user3.id,
        bestScore: 85.5,
        bestTime: 240,
        attempts: 1,
        rank: 2,
      },
      {
        quizId: sampleQuiz.id,
        userId: user2.id,
        bestScore: 66.67,
        bestTime: 300,
        attempts: 1,
        rank: 3,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✓ Updated leaderboard");

  // Create quiz reviews
  await prisma.quizReview.createMany({
    data: [
      {
        userId: user.id,
        quizId: sampleQuiz.id,
        rating: 5,
        comment: "Excellent quiz! Really tests your cricket knowledge.",
      },
      {
        userId: user2.id,
        quizId: sampleQuiz.id,
        rating: 4,
        comment: "Good questions, but a bit too hard for beginners.",
      },
      {
        userId: user3.id,
        quizId: sampleQuiz.id,
        rating: 5,
        comment: "Love the difficulty level. Perfect for cricket fans!",
      },
      {
        userId: moderator.id,
        quizId: sampleQuiz.id,
        rating: 5,
      },
    ],
    skipDuplicates: true,
  });

  // Update quiz rating
  await prisma.quiz.update({
    where: { id: sampleQuiz.id },
    data: {
      averageRating: 4.75,
      totalReviews: 4,
    },
  });

  console.log("✓ Created quiz reviews");

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "FRIEND_REQUEST",
        content: JSON.stringify({
          title: "You have a new friend request",
          fromUserId: user4.id,
          fromUserName: "Sarah Wilson",
        }),
        read: false,
      },
      {
        userId: user.id,
        type: "BADGE_EARNED",
        content: JSON.stringify({
          title: "You earned a new badge",
          badgeName: "Early Bird",
          badgeDescription: "Complete your first quiz",
        }),
        read: true,
      },
      {
        userId: user2.id,
        type: "FRIEND_ACCEPTED",
        content: JSON.stringify({
          title: "Your friend request was accepted",
          byUserId: user.id,
          byUserName: "Sample User",
        }),
        read: false,
      },
      {
        userId: moderator.id,
        type: "FRIEND_REQUEST",
        content: JSON.stringify({
          title: "You have a new friend request",
          fromUserId: user3.id,
          fromUserName: "Jane Smith",
        }),
        read: false,
      },
    ],
  });

  console.log("✓ Created notifications");

  // Create topic stats for users
  await prisma.userTopicStats.createMany({
    data: [
      {
        userId: user.id,
        topicId: cricket.id,
        questionsAnswered: 3,
        questionsCorrect: 3,
        successRate: 100,
        averageTime: 25,
      },
      {
        userId: user2.id,
        topicId: cricket.id,
        questionsAnswered: 3,
        questionsCorrect: 2,
        successRate: 66.67,
        averageTime: 35,
      },
      {
        userId: user2.id,
        topicId: batting.id,
        questionsAnswered: 1,
        questionsCorrect: 1,
        successRate: 100,
        averageTime: 20,
      },
      {
        userId: user3.id,
        topicId: cricket.id,
        questionsAnswered: 3,
        questionsCorrect: 2,
        successRate: 66.67,
        averageTime: 30,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✓ Created topic statistics");

  console.log("\n✅ Database seeding completed successfully!");
  console.log("\nCreated:");
  console.log(`- 6 users (2 regular, 1 moderator, 1 admin, 2 with pending requests)`);
  console.log(`- 6 topics (Sports hierarchy)`);
  console.log(`- 2 quiz tags`);
  console.log(`- 1 quiz with 3 questions`);
  console.log(`- 10 badges`);
  console.log(`- 6 friend relationships (4 accepted, 2 pending)`);
  console.log(`- 6 badge awards`);
  console.log(`- 4 quiz reviews`);
  console.log(`- 4 notifications`);
  console.log(`- 3 quiz attempts with leaderboard`);
  console.log(`- 4 topic statistics`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
