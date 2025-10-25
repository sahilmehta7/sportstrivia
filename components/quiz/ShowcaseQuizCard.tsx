"use client";

import { cn } from "@/lib/utils";
import { getSportGradient } from "@/lib/quiz-formatters";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard } from "@/lib/showcase-theme";

interface ShowcaseQuizCardProps {
  title: string;
  badgeLabel?: string;
  durationLabel: string;
  playersLabel: string;
  accent?: string;
  coverImageUrl?: string | null;
  className?: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function ShowcaseQuizCard({
  title,
  badgeLabel,
  durationLabel,
  playersLabel,
  accent,
  coverImageUrl,
  className,
}: ShowcaseQuizCardProps) {
  const { theme } = useShowcaseTheme();
  const gradient = accent ?? getSportGradient(undefined, hashString(`${title}`));
  const label = (badgeLabel ?? "Featured").toUpperCase();

  return (
    <div className={cn("w-[300px]", className)}>
      <div className={cn("flex h-full flex-col overflow-hidden rounded-[2.25rem] border shadow-[0_30px_70px_-28px_rgba(0,0,0,0.8)]", getGlassCard(theme))}>
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <div className={cn("absolute inset-0", `bg-gradient-to-br ${gradient}`)} />
          {coverImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${coverImageUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/80" />
          <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
            <div className="flex items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em]">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm">
                <span className="text-sm" aria-hidden="true">
                  ⏱️
                </span>
                <span className="tracking-tight">{durationLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm">
                <span className="text-sm" aria-hidden="true">
                  👥
                </span>
                <span className="tracking-tight">{playersLabel}</span>
              </span>
            </div>
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-white/70">
                {label}
              </p>
              <h3 className="mt-2 text-2xl font-bold leading-tight drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                {title}
              </h3>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-4">
          <p className={cn("text-xs", theme === "light" ? "text-slate-600" : "text-white/70")}>Swipe to explore the full lineup.</p>
        </div>
      </div>
    </div>
  );
}
