import type { Metadata } from "next";
import { headers } from "next/headers";
import { ShowcaseLeaderboard, type LeaderboardEntry, type LeaderboardRangeKey } from "@/components/quiz/ShowcaseLeaderboard";
import { notFound } from "next/navigation";

// Route segment config
export const revalidate = 300; // Revalidate every 5 minutes for leaderboard

export const metadata: Metadata = {
  title: "Global Leaderboard - Top Performers",
  description: "View the top performers in sports trivia. Check daily and all-time leaderboards to see who's dominating the competition.",
  keywords: ["leaderboard", "top performers", "rankings", "competitive gaming", "sports trivia champions"],
  openGraph: {
    title: "Global Leaderboard - Top Performers",
    description: "View the top performers in sports trivia. Check daily and all-time leaderboards to see who's dominating the competition.",
    type: "website",
    url: "/leaderboard",
  },
  twitter: {
    card: "summary",
    title: "Global Leaderboard - Top Performers",
    description: "View the top performers in sports trivia. Check daily and all-time leaderboards.",
  },
  alternates: {
    canonical: "/leaderboard",
  },
};

async function fetchLeaderboard(baseUrl: string, period: string): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${baseUrl}/api/leaderboards/global?period=${period}&limit=10`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const json = await response.json();
  const leaderboard = json?.data?.leaderboard ?? [];

  return leaderboard.map((entry: any, index: number) => ({
    id: `${period}-${entry.userId ?? index}`,
    name: entry.userName || entry.userId || `Player ${index + 1}`,
    score: Math.round(entry.totalPoints ?? entry.score ?? 0),
    avatarUrl: entry.userImage ?? null,
    position: entry.rank ?? index + 1,
  }));
}

export default async function LeaderboardPage() {
  const headersList = headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "https";

  if (!host) {
    notFound();
  }

  const baseUrl = `${protocol}://${host}`;

  const [daily, allTime] = await Promise.all([
    fetchLeaderboard(baseUrl, "daily"),
    fetchLeaderboard(baseUrl, "all-time"),
  ]);

  if (daily.length === 0 && allTime.length === 0) {
    notFound();
  }

  const datasets: Record<LeaderboardRangeKey, LeaderboardEntry[]> = {
    daily,
    "all-time": allTime,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Global Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Track the top performers in daily quizzes and all-time rankings.
          </p>
        </header>

        <div className="flex justify-center">
          <ShowcaseLeaderboard title="Leaderboard" datasets={datasets} initialRange={daily.length > 0 ? "daily" : "all-time"} />
        </div>
      </div>
    </main>
  );
}
