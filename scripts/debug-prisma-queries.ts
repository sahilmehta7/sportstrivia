
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

async function debug() {
    console.log("Fetching a sample quiz ID...");
    const quiz = await prisma.quiz.findFirst({
        where: { isPublished: true, status: "PUBLISHED" },
        select: { id: true }
    });

    if (!quiz) {
        console.log("No published quiz found.");
        return;
    }

    const quizId = quiz.id;
    console.log(`Testing with quizId: ${quizId}`);

    try {
        console.log("Testing RAW QUERY for Leaderboard...");

        // Force test the raw query path
        const rows = await prisma.$queryRaw<any[]>(
            Prisma.sql`
            WITH per_period_best AS (
                SELECT
                "userId",
                date_trunc('day', "completedAt") AS period_start,
                MAX("totalPoints") AS best_points,
                AVG(COALESCE("averageResponseTime", 0)) AS avg_response
                FROM "QuizAttempt"
                WHERE "quizId" = ${quizId}
                AND "isPracticeMode" = false
                AND "completedAt" IS NOT NULL
                GROUP BY "userId", date_trunc('day', "completedAt")
            ),
            aggregated AS (
                SELECT
                "userId",
                SUM(best_points) AS sum_points,
                AVG(avg_response) AS avg_response
                FROM per_period_best
                GROUP BY "userId"
            )
            SELECT a."userId", a.sum_points::int AS "bestPoints", a.avg_response, u.name, u.email
            FROM aggregated a
            JOIN "User" u ON u.id = a."userId"
            ORDER BY a.sum_points DESC, a.avg_response ASC
            LIMIT 5
        `
        );
        console.log("Raw Query: Success");
        console.log("Rows returned:", rows.length);

    } catch (error) {
        console.error("Error during raw query:", error);
    }
}

debug()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
