
import { prisma } from "@/lib/db";
import { getCachedQuiz, getCachedQuizStats, getCachedLeaderboard } from "@/lib/quiz-cache";

async function debug() {
    console.log("Fetching a sample quiz slug...");
    const quiz = await prisma.quiz.findFirst({
        where: { isPublished: true, status: "PUBLISHED" },
        select: { slug: true, id: true }
    });

    if (!quiz) {
        console.log("No published quiz found.");
        return;
    }

    console.log(`Testing with quiz: ${quiz.slug} (${quiz.id})`);

    try {
        console.log("1. Fetching cached quiz...");
        const cachedQuiz = await getCachedQuiz(quiz.slug);
        console.log("Cached Quiz fetched:", cachedQuiz ? "Success" : "Null");

        if (!cachedQuiz) return;

        console.log("2. Fetching stats...");
        const stats = await getCachedQuizStats(quiz.id);
        console.log("Stats fetched:", stats ? "Success" : "Null");

        console.log("3. Fetching leaderboard...");
        const leaderboard = await getCachedLeaderboard(quiz.id, cachedQuiz.recurringType);
        console.log("Leaderboard fetched:", leaderboard ? "Success" : "Null");
        console.log("Leaderboard entries:", leaderboard.length);

    } catch (error) {
        console.error("Error during debug fetch:", error);
    }
}

debug()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
