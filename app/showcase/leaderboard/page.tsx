import { headers } from "next/headers";
import { ShowcaseLeaderboard, type LeaderboardEntry, type LeaderboardRangeKey } from "@/components/quiz/ShowcaseLeaderboard";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import { notFound } from "next/navigation";

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

export default async function ShowcaseLeaderboardPage() {
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
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Leaderboard"
        subtitle="Global leaderboards with daily and all-time rankings"
        badge="LEADERBOARD SHOWCASE"
        variant="cool"
      >
        <ShowcaseLeaderboard title="Leaderboard" datasets={datasets} initialRange={daily.length > 0 ? "daily" : "all-time"} />
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
