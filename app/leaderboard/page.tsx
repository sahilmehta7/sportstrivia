import { Trophy } from "lucide-react";

import {
  LeaderboardTabs,
  type LeaderboardDataset,
  type LeaderboardEntry,
} from "@/components/leaderboard/leaderboard-tabs";
import { buildGlobalLeaderboard } from "@/lib/services/leaderboard.service";

export const revalidate = 0;

async function mapLeaderboardEntries(period: "daily" | "all-time"): Promise<LeaderboardEntry[]> {
  try {
    const leaderboard = await buildGlobalLeaderboard(period, 10);

    return leaderboard.map((entry) => {
      const totalPoints = entry.totalPoints ?? entry.score ?? 0;
      const attempts = entry.attempts ?? 0;
      const averagePoints = attempts > 0 ? totalPoints / attempts : totalPoints;

      return {
        userId: entry.userId,
        name: entry.userName ?? "Anonymous Fan",
        image: entry.userImage ?? null,
        totalScore: totalPoints,
        averageScore: averagePoints,
        count: attempts,
      } satisfies LeaderboardEntry;
    });
  } catch (error) {
    console.error(`Failed to load ${period} leaderboard`, error);
    return [];
  }
}

export default async function LeaderboardPage() {
  const [dailyEntries, allTimeEntries] = await Promise.all([
    mapLeaderboardEntries("daily"),
    mapLeaderboardEntries("all-time"),
  ]);

  const dailyDataset: LeaderboardDataset = {
    entries: dailyEntries,
    countLabel: "attempt",
    totalLabel: "Total Points",
  };

  const allTimeDataset: LeaderboardDataset = {
    entries: allTimeEntries,
    countLabel: "attempt",
    totalLabel: "Total Points",
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
