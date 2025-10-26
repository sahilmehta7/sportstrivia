"use client";

import Image from "next/image";
import { Star, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard } from "@/lib/showcase-theme";

interface ShowcaseFeaturedQuizCardProps {
  title: string;
  subtitle?: string | null;
  category: string;
  durationLabel: string;
  difficultyLabel: string;
  playersLabel: string;
  ratingLabel?: string;
  coverImageUrl?: string | null;
  accent?: string;
  className?: string;
}

export function ShowcaseFeaturedQuizCard({
  title,
  subtitle,
  category,
  durationLabel,
  difficultyLabel,
  playersLabel,
  ratingLabel,
  coverImageUrl,
  accent = "from-orange-500/90 via-pink-500/80 to-purple-600/80",
  className,
}: ShowcaseFeaturedQuizCardProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div
      className={cn(
        "relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[2.75rem] border backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_40px_120px_-50px_rgba(249,115,22,0.55)] md:flex-row",
        getGlassCard(theme),
        className
      )}
    >
      <div className={cn("absolute inset-0 -z-10 bg-gradient-to-br opacity-70", accent)} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />

      <div className="flex flex-1 flex-col gap-6 px-8 py-10 md:px-12 md:py-12">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
          {category}
        </div>

        <div className="space-y-3 text-white">
          <h2 className="text-4xl font-black leading-tight md:text-5xl">{title}</h2>
          {subtitle && (
            <p className="max-w-xl text-sm text-white/80">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/10 px-4 py-3">
            <Clock className="h-4 w-4" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Duration</p>
              <p className="text-sm font-semibold text-white">{durationLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/10 px-4 py-3">
            <Users className="h-4 w-4" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Players</p>
              <p className="text-sm font-semibold text-white">{playersLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/10 px-4 py-3">
            <span className="text-base font-semibold">🎯</span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Difficulty</p>
              <p className="text-sm font-semibold text-white capitalize">{difficultyLabel}</p>
            </div>
          </div>
          {ratingLabel && (
            <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/10 px-4 py-3">
              <Star className="h-4 w-4" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Rating</p>
                <p className="text-sm font-semibold text-white">{ratingLabel}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-white/70">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">Live Leaderboard</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">Bonus Rounds</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">Coach Insights</span>
        </div>
      </div>

      <div className="relative flex min-h-[240px] flex-1 items-end overflow-hidden rounded-t-[2.75rem] bg-white/5 md:rounded-l-[2.75rem] md:rounded-tr-none">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 480px, 100vw"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/15 to-transparent text-6xl text-white/60">
            🏆
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative w-full space-y-2 px-8 pb-10 text-white md:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Featured Quiz</p>
          <p className="text-lg font-semibold">Unlock exclusive badges when you finish under the time cap.</p>
        </div>
      </div>
    </div>
  );
}
