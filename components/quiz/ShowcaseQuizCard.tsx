"use client";

import { cn } from "@/lib/utils";
import { getSportGradient } from "@/lib/quiz-formatters";

interface ShowcaseQuizCardProps {
  title: string;
  badgeLabel?: string;
  durationLabel: string;
  playersLabel: string;
  icon?: string;
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
  icon = "⚽️",
  accent,
  coverImageUrl,
  className,
}: ShowcaseQuizCardProps) {
  const gradient = accent ?? getSportGradient(undefined, hashString(`${title}`));
  const label = (badgeLabel ?? "Featured").toUpperCase();

  return (
    <div className={cn("w-[300px]", className)}>
      <div className="flex h-full flex-col overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-950/80 text-white shadow-[0_30px_70px_-28px_rgba(0,0,0,0.8)]">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <div className={cn("absolute inset-0", `bg-gradient-to-br ${gradient}`)} />
          {coverImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${coverImageUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
        </div>

        <div className="flex flex-1 flex-col justify-between px-5 pb-5 pt-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/40 text-xl shadow-inner shadow-black/20">
              <span>{icon}</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-white/50">{label}</p>
              <p className="mt-2 text-lg font-bold leading-tight text-white">{title}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/70">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-base">⏱️</span>
                {durationLabel}
              </span>
              <span className="flex items-center gap-2">
                {playersLabel}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M8 11a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm8-6a3 3 0 1 0 3 3 3 3 0 0 0-3-3Zm0 7a4.94 4.94 0 0 0-3.61 1.59A6.95 6.95 0 0 1 12 15.76 6.95 6.95 0 0 1 9.61 13.6 4.94 4.94 0 0 0 6 12a5 5 0 0 0-5 5 1 1 0 0 0 1 1h12a6.94 6.94 0 0 1 1.42-4h2.16A6.94 6.94 0 0 1 19 18h4a1 1 0 0 0 1-1 5 5 0 0 0-5-5Z" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
