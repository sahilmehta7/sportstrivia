import { PrismaClient, BadgeCategory, BadgeRarity, QuestionType, Difficulty } from "@prisma/client";
import { checkAndAwardBadges } from "../lib/services/badge.service";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting verification...");

    // 1. Create a test user
    const user = await prisma.user.create({
        data: {
            email: `test-${Date.now()}@example.com`,
            name: "Badge Tester",
            image: "https://example.com/avatar.jpg"
        },
    });
    console.log(`Created user: ${user.id}`);

    // 2. Create a Topic "Football" if not exists
    let topic = await prisma.topic.findUnique({ where: { slug: "football" } });
    if (!topic) {
        topic = await prisma.topic.create({
            data: {
                name: "Football",
                slug: "football",
                description: "Football quizzes",
            },
        });
    }

    // 3. Create a Quiz in that topic
    const quiz = await prisma.quiz.create({
        data: {
            title: "Football Quiz 1",
            slug: `football-quiz-${Date.now()}`,
            description: "Test quiz",
            difficulty: Difficulty.EASY,
            sport: "Football",
            topicConfigs: {
                create: {
                    topicId: topic.id,
                    questionCount: 5,
                    difficulty: Difficulty.EASY
                }
            }
        },
    });
    console.log(`Created quiz: ${quiz.id}`);

    // 4. Simulate 10 attempts
    console.log("Simulating 10 attempts...");
    for (let i = 0; i < 10; i++) {
        const attempt = await prisma.quizAttempt.create({
            data: {
                userId: user.id,
                quizId: quiz.id,
                score: 100,
                passed: true,
                completedAt: new Date(),
                totalPoints: 100,
                startedAt: new Date(),
            },
        });
    }

    // 5. Run badge check
    console.log("Checking badges...");

    // DEBUG: Check badges in DB
    const allBadges = await prisma.badge.findMany();
    console.log("All badges in DB:", allBadges.map(b => b.name));

    // DEBUG: Check attempts
    const count = await prisma.quizAttempt.count({
        where: {
            userId: user.id,
            completedAt: { not: null },
            quiz: { sport: "Football" }
        }
    });
    console.log(`Debug: User has ${count} completed attempts for Football quizzes`);

    const newBadges = await checkAndAwardBadges(user.id);
    console.log("New badges awarded:", newBadges);

    // 6. Verify "Football Fanatic" is in user badges
    const userBadges = await prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true },
    });

    const hasFanatic = userBadges.some(ub => ub.badge.name === "Football Fanatic");

    if (hasFanatic) {
        console.log("✅ SUCCESS: 'Football Fanatic' badge awarded!");
    } else {
        console.error("❌ FAILURE: 'Football Fanatic' badge NOT awarded.");
        console.log("Current badges:", userBadges.map(ub => ub.badge.name));
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
