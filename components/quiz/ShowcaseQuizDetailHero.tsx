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
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/50 lg:p-10">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-zinc-950/0 to-zinc-950/0" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-stretch">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              {badgeLabel}
            </span>
          </div>

          <h2 className="mt-6 text-5xl font-black uppercase tracking-tighter text-white sm:text-6xl lg:text-7xl">
            {firstWord}
            {remainder && <span className="text-zinc-500"> {remainder}</span>}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm font-medium leading-relaxed text-zinc-400 lg:mx-0">
            {description
              ? description
              : "Blitz through fresh trivia curated for diehard fans. Battle against the clock and climb your league leaderboard."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 border-y border-white/5 py-6 lg:justify-start">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                  {metric.label}
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold tabular-nums tracking-tight",
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
                  className={`relative h-10 w-10 rounded-full border-2 border-zinc-950 bg-gradient-to-br ${gradient} ring-1 ring-white/10`}
                />
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-950 bg-zinc-900 ring-1 ring-white/10">
                <span className="text-[10px] font-bold text-white">+</span>
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-500">
              <span className="text-white">{playersLabel}</span> active players
            </p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Link
              href={`/quizzes/${slug}/play`}
              className="group inline-flex items-center gap-3 rounded-md bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]"
            >
              Start Quiz
              <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href={`/quizzes/${slug}`}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white/10"
            >
              Details
            </Link>
          </div>
        </div>

        <div className="relative flex w-full max-w-md flex-col items-stretch gap-6 rounded-xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm lg:max-w-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Leaderboard</span>
            <div className="flex items-center gap-1.5 rounded-sm bg-emerald-500/10 px-2 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Live</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {(leaderboardEntries.length ? leaderboardEntries : [
              { name: "Be the first", score: 0, rankLabel: "" },
            ]).map((player, index) => (
              <div
                key={`${player.name}-${index}`}
                className="group flex items-center justify-between rounded-md border border-transparent bg-white/5 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-600">{(index + 1).toString().padStart(2, '0')}</span>
                  <div>
                    <p className="font-bold text-white">{player.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Score</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums text-emerald-400">{player.score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
