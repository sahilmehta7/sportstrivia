import { Trophy } from "lucide-react";

import {
  LeaderboardTabs,
  type LeaderboardDataset,
  type LeaderboardEntry,
} from "@/components/leaderboard/leaderboard-tabs";
import { prisma } from "@/lib/db";

export const revalidate = 0;

async function getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const results = await prisma.quizAttempt.groupBy({
      by: ["userId"],
      where: {
        completedAt: {
          gte: startOfDay,
        },
        isPracticeMode: false,
      },
      _sum: { score: true },
      _avg: { score: true },
      _count: { id: true },
      orderBy: [
        { _sum: { score: "desc" } },
        { _avg: { score: "desc" } },
      ],
      take: 10,
    });

    const userIds = results.map((entry) => entry.userId);

    if (userIds.length === 0) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    return results.map((entry) => {
      const user = userMap.get(entry.userId);

      return {
        userId: entry.userId,
        name: user?.name ?? "Anonymous Fan",
        image: user?.image ?? null,
        totalScore: entry._sum.score ?? 0,
        averageScore: entry._avg.score ?? 0,
        count: entry._count.id ?? 0,
      } satisfies LeaderboardEntry;
    });
  } catch (error) {
    console.error("Failed to load daily leaderboard", error);
    return [];
  }
}

async function getAllTimeLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const results = await prisma.quizLeaderboard.groupBy({
      by: ["userId"],
      _sum: { bestScore: true },
      _avg: { bestScore: true },
      _count: { id: true },
      orderBy: [
        { _sum: { bestScore: "desc" } },
        { _avg: { bestScore: "desc" } },
      ],
      take: 10,
    });

    const userIds = results.map((entry) => entry.userId);

    if (userIds.length === 0) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    return results.map((entry) => {
      const user = userMap.get(entry.userId);

      return {
        userId: entry.userId,
        name: user?.name ?? "Anonymous Fan",
        image: user?.image ?? null,
        totalScore: entry._sum.bestScore ?? 0,
        averageScore: entry._avg.bestScore ?? 0,
        count: entry._count.id ?? 0,
      } satisfies LeaderboardEntry;
    });
  } catch (error) {
    console.error("Failed to load all-time leaderboard", error);
    return [];
  }
}

export default async function LeaderboardPage() {
  const [dailyEntries, allTimeEntries] = await Promise.all([
    getDailyLeaderboard(),
    getAllTimeLeaderboard(),
  ]);

  const dailyDataset: LeaderboardDataset = {
    entries: dailyEntries,
    countLabel: "attempt",
    totalLabel: "Total Score",
  };

  const allTimeDataset: LeaderboardDataset = {
    entries: allTimeEntries,
    countLabel: "quiz",
    totalLabel: "Leaderboard Points",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 pb-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pt-16 sm:px-6 lg:px-8">
        <header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Global Leaderboard
              </h1>
              <p className="text-muted-foreground">
                Track the top performers in daily quizzes and all-time rankings.
              </p>
            </div>
          </div>
        </header>

        <LeaderboardTabs daily={dailyDataset} allTime={allTimeDataset} />
      </div>
    </main>
  );
}
