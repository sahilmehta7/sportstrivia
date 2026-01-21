import type { Metadata } from "next";
import { headers } from "next/headers";
import { ShowcaseLeaderboard, type LeaderboardEntry, type LeaderboardRangeKey } from "@/components/quiz/ShowcaseLeaderboard";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/shared/PageContainer";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

// Route segment config
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Global Leaderboard - Neon Arena",
  description: "View the top contenders in the Sports Trivia arena. Check daily and all-time rankings.",
};

async function fetchLeaderboard(baseUrl: string, period: string): Promise<LeaderboardEntry[]> {
  try {
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
  } catch (error) {
    console.error(`Error fetching ${period} leaderboard:`, error);
    return [];
  }
}

export default async function LeaderboardPage() {
  const headersList = await headers();
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
    <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-24">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 -z-10">
        {getBlurCircles()}
      </div>

      <PageContainer variant="narrow" className="space-y-16 lg:space-y-24">
        <header className="flex flex-col items-center text-center gap-6 px-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary shadow-neon-cyan/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live Arena Rankings
            </div>
            <h1 className={cn(
              "text-5xl font-black tracking-tighter lg:text-8xl lg:leading-[0.8] uppercase",
              getGradientText("neon")
            )}>
              THE HALL <br className="hidden lg:block" /> OF HEROES
            </h1>
          </div>
          <p className="max-w-xl text-muted-foreground font-medium text-lg leading-relaxed">
            Behold the greatest trivia contenders. Compete in daily arenas to secure your place in history.
          </p>
        </header>

        <div className="relative px-2 sm:px-0">
          {/* Decorative accents for the leaderboard container */}
          <div className="absolute -top-12 -left-12 h-64 w-64 bg-primary/5 blur-3xl rounded-full -z-10" />
          <div className="absolute -bottom-12 -right-12 h-64 w-64 bg-secondary/5 blur-3xl rounded-full -z-10" />

          <ShowcaseLeaderboard title="GLOBAL RANKINGS" datasets={datasets} initialRange={daily.length > 0 ? "daily" : "all-time"} />
        </div>
      </PageContainer>
    </main>
  );
}
