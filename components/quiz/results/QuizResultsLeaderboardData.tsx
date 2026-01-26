import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { QuizResultsLeaderboard } from "./QuizResultsLeaderboard";
import { QuizResultsCard } from "./QuizResultsCard";
import { QuizResultsSection } from "./QuizResultsSection";
import { unstable_cache } from "next/cache";

interface QuizResultsLeaderboardDataProps {
    quizId: string;
    recurringType: string;
}

const getCachedLeaderboard = unstable_cache(
    async (quizId: string, recurringType: string) => {
        if (recurringType === "DAILY" || recurringType === "WEEKLY") {
            const isDaily = recurringType === "DAILY";
            const rows = await prisma.$queryRaw<Array<{
                userId: string;
                bestPoints: number;
                avg_response: number | null;
                name: string | null;
                image: string | null;
            }>>(
                isDaily
                    ? Prisma.sql`
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
              SELECT a."userId", a.sum_points::int AS "bestPoints", a.avg_response, u.name, u.image
              FROM aggregated a
              JOIN "User" u ON u.id = a."userId"
              ORDER BY a.sum_points DESC, a.avg_response ASC
              LIMIT 10
            `
                    : Prisma.sql`
              WITH per_period_best AS (
                SELECT
                  "userId",
                  date_trunc('week', "completedAt") AS period_start,
                  MAX("totalPoints") AS best_points,
                  AVG(COALESCE("averageResponseTime", 0)) AS avg_response
                FROM "QuizAttempt"
                WHERE "quizId" = ${quizId}
                  AND "isPracticeMode" = false
                  AND "completedAt" IS NOT NULL
                GROUP BY "userId", date_trunc('week', "completedAt")
              ),
              aggregated AS (
                SELECT
                  "userId",
                  SUM(best_points) AS sum_points,
                  AVG(avg_response) AS avg_response
                FROM per_period_best
                GROUP BY "userId"
              )
              SELECT a."userId", a.sum_points::int AS "bestPoints", a.avg_response, u.name, u.image
              FROM aggregated a
              JOIN "User" u ON u.id = a."userId"
              ORDER BY a.sum_points DESC, a.avg_response ASC
              LIMIT 10
            `
            );

            return rows.map((r) => ({
                userId: r.userId,
                userName: r.name,
                userImage: r.image,
                score: Number(r.bestPoints),
                totalPoints: Number(r.bestPoints),
            }));
        } else {
            const results = await prisma.quizLeaderboard.findMany({
                where: {
                    quizId: quizId,
                },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                },
                orderBy: [
                    { bestPoints: "desc" },
                    { averageResponseTime: "asc" },
                    { bestScore: "desc" },
                ],
                take: 10,
            });

            return results.map((entry) => ({
                userId: entry.user.id,
                userName: entry.user.name,
                userImage: entry.user.image,
                score: entry.bestPoints || entry.bestScore || 0,
                totalPoints: entry.bestPoints || 0,
            }));
        }
    },
    ["quiz-leaderboard"],
    { revalidate: 300, tags: ["leaderboard"] } // Cache for 5 minutes
);

export function LeaderboardSkeleton() {
    return (
        <QuizResultsCard className="mt-4 animate-pulse">
            <QuizResultsSection title="Top Players" className="p-6">
                <div className="space-y-8">
                    <div className="flex items-end justify-center gap-4 pb-4 pt-8">
                        <div className="h-16 w-16 rounded-full bg-slate-200" />
                        <div className="h-20 w-20 rounded-full bg-slate-200" />
                        <div className="h-14 w-14 rounded-full bg-slate-200" />
                    </div>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 w-full rounded-2xl bg-slate-100" />
                        ))}
                    </div>
                </div>
            </QuizResultsSection>
        </QuizResultsCard>
    );
}

export async function QuizResultsLeaderboardData({
    quizId,
    recurringType,
}: QuizResultsLeaderboardDataProps) {
    const leaderboardEntries = await getCachedLeaderboard(quizId, recurringType);

    const formattedEntries = leaderboardEntries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
    }));

    return (
        <QuizResultsCard className="mt-4">
            <QuizResultsSection title="Top Players" className="p-6">
                <QuizResultsLeaderboard entries={formattedEntries} />
            </QuizResultsSection>
        </QuizResultsCard>
    );
}
