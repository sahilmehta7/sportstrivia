import { headers } from "next/headers";
import { ShowcaseLeaderboard, type LeaderboardEntry, type LeaderboardRangeKey } from "@/components/quiz/ShowcaseLeaderboard";
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-amber-500 px-4 py-12 sm:px-6 lg:py-16">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-400/40 blur-[120px]" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/40 blur-[100px]" />
        <div className="absolute bottom-12 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[90px]" />
      </div>

      <ShowcaseLeaderboard title="Leaderboard" datasets={datasets} initialRange={daily.length > 0 ? "daily" : "all-time"} />
    </div>
  );
}
