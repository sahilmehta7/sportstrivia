import { PrismaClient, Difficulty, QuestionType, BadgeCategory, BadgeRarity } from "@prisma/client";
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
  const _user = await prisma.user.upsert({
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
    update: {
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON
    },
    create: {
      name: "First Quiz Complete",
      description: "Complete your first quiz",
      imageUrl: "/badges/first-quiz.png",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON,
      criteria: { type: "quiz_complete", count: 1 },
    },
  });

  const _perfectScoreBadge = await prisma.badge.upsert({
    where: { name: "Perfect Round" },
    update: {
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.EPIC
    },
    create: {
      name: "Perfect Round",
      description: "Achieve a perfect score on any quiz",
      imageUrl: "/badges/perfect-score.png",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.EPIC,
      criteria: { type: "perfect_score", count: 1 },
    },
  });

  // Create remaining badges
  const _quizMasterBadge = await prisma.badge.upsert({
    where: { name: "Quiz Master" },
    update: {
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Quiz Master",
      description: "Complete 10 quizzes",
      imageUrl: "/badges/quiz-master.png",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.RARE,
      criteria: { type: "quiz_complete", count: 10 },
    },
  });

  const _earlyBirdBadge = await prisma.badge.upsert({
    where: { name: "Early Bird" },
    update: {
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON
    },
    create: {
      name: "Early Bird",
      description: "Complete your first quiz",
      imageUrl: "/badges/early-bird.png",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON,
      criteria: { type: "first_quiz", count: 1 },
    },
  });

  const _streakWarriorBadge = await prisma.badge.upsert({
    where: { name: "Streak Warrior" },
    update: {
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Streak Warrior",
      description: "Maintain a 7-day streak",
      imageUrl: "/badges/streak-warrior.png",
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.RARE,
      criteria: { type: "streak", count: 7 },
    },
  });

  const _socialButterflyBadge = await prisma.badge.upsert({
    where: { name: "Social Butterfly" },
    update: {
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON
    },
    create: {
      name: "Social Butterfly",
      description: "Add 5 friends",
      imageUrl: "/badges/social-butterfly.png",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON,
      criteria: { type: "friends", count: 5 },
    },
  });

  const _challengerBadge = await prisma.badge.upsert({
    where: { name: "Challenger" },
    update: {
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Challenger",
      description: "Win 5 challenges",
      imageUrl: "/badges/challenger.png",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.RARE,
      criteria: { type: "challenge_wins", count: 5 },
    },
  });

  const _reviewerBadge = await prisma.badge.upsert({
    where: { name: "Reviewer" },
    update: {
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON
    },
    create: {
      name: "Reviewer",
      description: "Review 10 quizzes",
      imageUrl: "/badges/reviewer.png",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON,
      criteria: { type: "reviews", count: 10 },
    },
  });

  const _lightningFastBadge = await prisma.badge.upsert({
    where: { name: "Lightning Fast" },
    update: {
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.EPIC
    },
    create: {
      name: "Lightning Fast",
      description: "Answer a question correctly in under 2 seconds",
      imageUrl: "/badges/lightning-fast.png",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.EPIC,
      criteria: { type: "fast_answer", seconds: 2 },
    },
  });

  const _comebackKidBadge = await prisma.badge.upsert({
    where: { name: "Comeback Kid" },
    update: {
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Comeback Kid",
      description: "Recover from two incorrect answers and still pass a quiz",
      imageUrl: "/badges/comeback-kid.png",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.RARE,
      criteria: { type: "comeback", minIncorrect: 2 },
    },
  });

  // --- NEW BADGES ---

  await prisma.badge.upsert({
    where: { name: "Football Fanatic" },
    update: {
      category: BadgeCategory.SPORT,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Football Fanatic",
      description: "Complete 10 Football quizzes",
      imageUrl: "/badges/football-fanatic.png",
      category: BadgeCategory.SPORT,
      rarity: BadgeRarity.RARE,
      criteria: { type: "sport_quiz_count", sport: "Football", count: 10 },
    },
  });

  await prisma.badge.upsert({
    where: { name: "Cricket Champion" },
    update: {
      category: BadgeCategory.SPORT,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Cricket Champion",
      description: "Complete 10 Cricket quizzes",
      imageUrl: "/badges/cricket-champion.png",
      category: BadgeCategory.SPORT,
      rarity: BadgeRarity.RARE,
      criteria: { type: "sport_quiz_count", sport: "Cricket", count: 10 },
    },
  });

  await prisma.badge.upsert({
    where: { name: "Basketball Star" },
    update: {
      category: BadgeCategory.SPORT,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Basketball Star",
      description: "Complete 10 Basketball quizzes",
      imageUrl: "/badges/basketball-star.png",
      category: BadgeCategory.SPORT,
      rarity: BadgeRarity.RARE,
      criteria: { type: "sport_quiz_count", sport: "Basketball", count: 10 },
    },
  });

  await prisma.badge.upsert({
    where: { name: "Tennis Ace" },
    update: {
      category: BadgeCategory.SPORT,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Tennis Ace",
      description: "Complete 10 Tennis quizzes",
      imageUrl: "/badges/tennis-ace.png",
      category: BadgeCategory.SPORT,
      rarity: BadgeRarity.RARE,
      criteria: { type: "sport_quiz_count", sport: "Tennis", count: 10 },
    },
  });

  await prisma.badge.upsert({
    where: { name: "History Buff" },
    update: {
      category: BadgeCategory.TOPIC,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "History Buff",
      description: "Answer 50 History questions correctly",
      imageUrl: "/badges/history-buff.png",
      category: BadgeCategory.TOPIC,
      rarity: BadgeRarity.RARE,
      criteria: { type: "topic_questions", topic: "History", count: 50 },
    },
  });

  await prisma.badge.upsert({
    where: { name: "Stats Savant" },
    update: {
      category: BadgeCategory.TOPIC,
      rarity: BadgeRarity.EPIC
    },
    create: {
      name: "Stats Savant",
      description: "Answer 50 questions correctly in Stats topics",
      imageUrl: "/badges/stats-savant.png",
      category: BadgeCategory.TOPIC,
      rarity: BadgeRarity.EPIC,
      criteria: { type: "topic_questions", topic: "Stats", count: 50 },
    },
  });

  await prisma.badge.upsert({
    where: { name: "Weekend Warrior" },
    update: {
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.EPIC
    },
    create: {
      name: "Weekend Warrior",
      description: "Complete quizzes on 4 consecutive weekends",
      imageUrl: "/badges/weekend-warrior.png",
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.EPIC,
      criteria: { type: "streak_weekend", count: 4 },
    },
  });

  await prisma.badge.upsert({
    where: { name: "Night Owl" },
    update: {
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Night Owl",
      description: "Complete 5 quizzes between 12 AM and 4 AM",
      imageUrl: "/badges/night-owl.png",
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.RARE,
      criteria: { type: "time_range", start: 0, end: 4, count: 5 },
    },
  });

  await prisma.badge.upsert({
    where: { name: "Early Riser" },
    update: {
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.RARE
    },
    create: {
      name: "Early Riser",
      description: "Complete 5 quizzes between 5 AM and 8 AM",
      imageUrl: "/badges/early-riser.png",
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.RARE,
      criteria: { type: "time_range", start: 5, end: 8, count: 5 },
    },
  });

  console.log("✓ Created badges");

  console.log("\n✅ Database seeding completed successfully!");
  console.log("\nCreated:");
  console.log(`- 2 users (1 admin, 1 sample user)`);
  console.log(`- 6 topics (Sports hierarchy)`);
  console.log(`- 2 quiz tags`);
  console.log(`- 1 quiz with 3 questions`);
  console.log(`- 19 badges`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
