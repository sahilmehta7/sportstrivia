import { PrismaClient, Difficulty, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Create admin user
  const admin = await prisma.user.upsert({
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
    update: {},
    create: {
      name: "Sports",
      slug: "sports",
      description: "General sports knowledge",
      level: 0,
    },
  });

  const cricket = await prisma.topic.upsert({
    where: { slug: "cricket" },
    update: {},
    create: {
      name: "Cricket",
      slug: "cricket",
      description: "Cricket trivia and facts",
      parentId: sports.id,
      level: 1,
    },
  });

  const batting = await prisma.topic.upsert({
    where: { slug: "batting" },
    update: {},
    create: {
      name: "Batting",
      slug: "batting",
      description: "Cricket batting techniques and records",
      parentId: cricket.id,
      level: 2,
    },
  });

  const bowling = await prisma.topic.upsert({
    where: { slug: "bowling" },
    update: {},
    create: {
      name: "Bowling",
      slug: "bowling",
      description: "Cricket bowling techniques and records",
      parentId: cricket.id,
      level: 2,
    },
  });

  const basketball = await prisma.topic.upsert({
    where: { slug: "basketball" },
    update: {},
    create: {
      name: "Basketball",
      slug: "basketball",
      description: "NBA and basketball trivia",
      parentId: sports.id,
      level: 1,
    },
  });

  const nba = await prisma.topic.upsert({
    where: { slug: "nba" },
    update: {},
    create: {
      name: "NBA",
      slug: "nba",
      description: "National Basketball Association",
      parentId: basketball.id,
      level: 2,
    },
  });

  console.log("✓ Created topic hierarchy");

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

  const championsTag = await prisma.quizTag.upsert({
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
  const firstQuizBadge = await prisma.badge.upsert({
    where: { name: "First Quiz Complete" },
    update: {},
    create: {
      name: "First Quiz Complete",
      description: "Complete your first quiz",
      imageUrl: "/badges/first-quiz.png",
      criteria: { type: "quiz_complete", count: 1 },
    },
  });

  const perfectScoreBadge = await prisma.badge.upsert({
    where: { name: "Perfect Score" },
    update: {},
    create: {
      name: "Perfect Score",
      description: "Achieve a perfect score on any quiz",
      imageUrl: "/badges/perfect-score.png",
      criteria: { type: "perfect_score", count: 1 },
    },
  });

  console.log("✓ Created badges");

  console.log("\n✅ Database seeding completed successfully!");
  console.log("\nCreated:");
  console.log(`- 2 users (admin@sportstrivia.com, user@sportstrivia.com)`);
  console.log(`- 6 topics (Sports hierarchy)`);
  console.log(`- 2 quiz tags`);
  console.log(`- 1 quiz with 3 questions`);
  console.log(`- 2 badges`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

