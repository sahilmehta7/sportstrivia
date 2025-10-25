import Link from "next/link";
import { cn } from "@/lib/utils";

interface ShowcaseQuizDetailMetric {
  label: string;
  value: string;
  accentClass?: string;
}

interface ShowcaseQuizDetailLeaderboardEntry {
  name: string;
  score: number;
  rankLabel: string;
}

interface ShowcaseQuizDetailHeroProps {
  badgeLabel: string;
  title: string;
  description?: string | null;
  metrics: ShowcaseQuizDetailMetric[];
  gradients: string[];
  playersLabel: string;
  leaderboardEntries: ShowcaseQuizDetailLeaderboardEntry[];
  slug: string;
}

export function ShowcaseQuizDetailHero({
  badgeLabel,
  title,
  description,
  metrics,
  gradients,
  playersLabel,
  leaderboardEntries,
  slug,
}: ShowcaseQuizDetailHeroProps) {
  const segments = title.split(" ");
  const firstWord = segments.shift() ?? title;
  const remainder = segments.join(" ");

  return (
    <div className="relative w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8 lg:p-10">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
            {badgeLabel.toUpperCase()}
          </div>

          <h2 className="mt-6 text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_16px_32px_rgba(32,32,48,0.35)] sm:text-5xl lg:text-6xl">
            {firstWord}
            {remainder && <span className="text-emerald-300"> {remainder}</span>}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm text-white/75 lg:mx-0">
            {description
              ? description
              : "Blitz through fresh trivia curated for diehard fans. Battle against the clock and climb your league leaderboard."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">
                  {metric.label}
                </p>
                <p
                  className={cn(
                    "text-3xl font-semibold",
                    metric.accentClass ? metric.accentClass : "text-white"
                  )}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <div className="flex -space-x-3">
              {gradients.map((gradient, index) => (
                <div
                  key={`${gradient}-${index}`}
                  className={`relative h-12 w-12 rounded-full border-2 border-white/30 bg-gradient-to-br ${gradient}`}
                >
                  <div className="absolute inset-0 rounded-full bg-black/20" />
                </div>
              ))}
            </div>
            <p className="text-xs text-white/70">
              Join <span className="font-semibold text-white">{playersLabel}</span> players competing
            </p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Link
              href={`/quizzes/${slug}/play`}
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-slate-900 shadow-lg shadow-pink-500/25 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-amber-500/40"
            >
              Start Quiz
              <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href={`/quizzes/${slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/60 hover:text-white"
            >
              View details
            </Link>
          </div>
        </div>

        <div className="relative flex w-full max-w-md flex-col items-stretch gap-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-white shadow-[0_40px_80px_-40px_rgba(15,15,35,0.7)] backdrop-blur-3xl sm:p-8 lg:max-w-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.35em] text-white/50">Leaderboard</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">Live</span>
          </div>

          <div className="space-y-4 text-sm">
            {(leaderboardEntries.length ? leaderboardEntries : [
              { name: "Be the first", score: 0, rankLabel: "" },
            ]).map((player, index) => (
              <div
                key={`${player.name}-${index}`}
                className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              >
                <div>
                  <p className="font-semibold text-white">{player.name}</p>
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/40">Score</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-300">{player.score}</p>
                  <p className="text-xs text-amber-300">{player.rankLabel || "Join"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
