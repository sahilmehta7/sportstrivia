import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Clean up database for testing
 */
export async function cleanupDatabase() {
  // Delete in correct order to respect foreign key constraints
  await prisma.userAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizReview.deleteMany();
  await prisma.questionReport.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quizQuestionPool.deleteMany();
  await prisma.quizTopicConfig.deleteMany();
  await prisma.quizTagRelation.deleteMany();
  await prisma.quizTag.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.quizLeaderboard.deleteMany();
  await prisma.userTopicStats.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.friend.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.media.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Create a test user
 */
export async function createTestUser(overrides?: any) {
  return await prisma.user.create({
    data: {
      email: overrides?.email || "test@example.com",
      name: overrides?.name || "Test User",
      role: overrides?.role || "USER",
      ...overrides,
    },
  });
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(overrides?: any) {
  return await createTestUser({
    email: "admin@example.com",
    name: "Admin User",
    role: "ADMIN",
    ...overrides,
  });
}

/**
 * Create a test topic
 */
export async function createTestTopic(overrides?: any) {
  return await prisma.topic.create({
    data: {
      name: overrides?.name || "Test Topic",
      slug: overrides?.slug || "test-topic",
      description: overrides?.description || "Test topic description",
      level: overrides?.level || 0,
      ...overrides,
    },
  });
}

/**
 * Create a test quiz
 */
export async function createTestQuiz(overrides?: any) {
  return await prisma.quiz.create({
    data: {
      title: overrides?.title || "Test Quiz",
      slug: overrides?.slug || "test-quiz",
      description: overrides?.description || "Test quiz description",
      difficulty: overrides?.difficulty || "MEDIUM",
      status: overrides?.status || "PUBLISHED",
      passingScore: overrides?.passingScore || 70,
      isPublished: overrides?.isPublished !== undefined ? overrides.isPublished : true,
      questionSelectionMode: overrides?.questionSelectionMode || "FIXED",
      ...overrides,
    },
  });
}

/**
 * Create a test question with answers
 */
export async function createTestQuestion(topicId: string, overrides?: any) {
  const question = await prisma.question.create({
    data: {
      topicId,
      questionText: overrides?.questionText || "Test question?",
      type: overrides?.type || "MULTIPLE_CHOICE",
      difficulty: overrides?.difficulty || "MEDIUM",
      ...overrides,
    },
  });

  // Create default answers if not provided
  if (!overrides?.skipAnswers) {
    await prisma.answer.createMany({
      data: [
        {
          questionId: question.id,
          answerText: "Correct Answer",
          isCorrect: true,
          displayOrder: 0,
        },
        {
          questionId: question.id,
          answerText: "Wrong Answer 1",
          isCorrect: false,
          displayOrder: 1,
        },
        {
          questionId: question.id,
          answerText: "Wrong Answer 2",
          isCorrect: false,
          displayOrder: 2,
        },
      ],
    });
  }

  return await prisma.question.findUnique({
    where: { id: question.id },
    include: { answers: true },
  });
}

/**
 * Seed test database with sample data
 */
export async function seedTestDatabase() {
  // Create topics
  const cricket = await createTestTopic({
    name: "Cricket",
    slug: "cricket",
  });

  const batting = await createTestTopic({
    name: "Batting",
    slug: "batting",
    parentId: cricket.id,
    level: 1,
  });

  // Create admin and regular user
  const admin = await createTestAdmin();
  const user = await createTestUser({ email: "user@example.com", name: "Regular User" });

  // Create a quiz
  const quiz = await createTestQuiz({
    title: "Cricket Basics",
    slug: "cricket-basics",
    sport: "Cricket",
  });

  // Create questions
  const question1 = await createTestQuestion(cricket.id, {
    questionText: "What is the maximum number of players in a cricket team?",
  });

  const question2 = await createTestQuestion(batting.id, {
    questionText: "What does LBW stand for?",
    difficulty: "EASY",
  });

  // Add questions to quiz
  await prisma.quizQuestionPool.createMany({
    data: [
      {
        quizId: quiz.id,
        questionId: question1!.id,
        order: 1,
        points: 1,
      },
      {
        quizId: quiz.id,
        questionId: question2!.id,
        order: 2,
        points: 1,
      },
    ],
  });

  return { admin, user, cricket, batting, quiz, question1, question2 };
}

export { prisma as testPrisma };

