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
  const isLight = theme === "light";

  return (
    <div
      className={cn(
        "relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[2.75rem] border backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_40px_120px_-50px_rgba(249,115,22,0.55)] md:flex-row",
        getGlassCard(theme),
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 -z-10 bg-gradient-to-br",
          accent,
          isLight ? "opacity-60" : "opacity-70"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 -z-20",
          isLight
            ? "bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.1),_transparent_55%)]"
            : "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]"
        )}
      />

      <div className="flex flex-1 flex-col gap-6 px-8 py-10 md:px-12 md:py-12">
        <div
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em]",
            isLight ? "bg-slate-900/10 text-slate-900" : "bg-white/15 text-white/80"
          )}
        >
          {category}
        </div>

        <div className={cn("space-y-3", isLight ? "text-slate-900" : "text-white")}> 
          <h2 className="text-4xl font-black leading-tight md:text-5xl">{title}</h2>
          {subtitle && (
            <p className={cn("max-w-xl text-sm", isLight ? "text-slate-600" : "text-white/80")}> 
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div
            className={cn(
              "flex items-center gap-3 rounded-[1.5rem] px-4 py-3",
              isLight ? "bg-slate-900/5 text-slate-700" : "bg-white/10 text-white/80"
            )}
          >
            <Clock className={cn("h-4 w-4", isLight ? "text-slate-700" : "text-white/80")} />
            <div>
              <p
                className={cn(
                  "text-xs uppercase tracking-[0.3em]",
                  isLight ? "text-slate-500" : "text-white/50"
                )}
              >
                Duration
              </p>
              <p className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{durationLabel}</p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-3 rounded-[1.5rem] px-4 py-3",
              isLight ? "bg-slate-900/5 text-slate-700" : "bg-white/10 text-white/80"
            )}
          >
            <Users className={cn("h-4 w-4", isLight ? "text-slate-700" : "text-white/80")} />
            <div>
              <p
                className={cn(
                  "text-xs uppercase tracking-[0.3em]",
                  isLight ? "text-slate-500" : "text-white/50"
                )}
              >
                Players
              </p>
              <p className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{playersLabel}</p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-3 rounded-[1.5rem] px-4 py-3",
              isLight ? "bg-slate-900/5 text-slate-700" : "bg-white/10 text-white/80"
            )}
          >
            <span className="text-base font-semibold">🎯</span>
            <div>
              <p
                className={cn(
                  "text-xs uppercase tracking-[0.3em]",
                  isLight ? "text-slate-500" : "text-white/50"
                )}
              >
                Difficulty
              </p>
              <p className={cn("text-sm font-semibold capitalize", isLight ? "text-slate-900" : "text-white")}>{difficultyLabel}</p>
            </div>
          </div>
          {ratingLabel && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-[1.5rem] px-4 py-3",
                isLight ? "bg-slate-900/5 text-slate-700" : "bg-white/10 text-white/80"
              )}
            >
              <Star className={cn("h-4 w-4", isLight ? "text-slate-700" : "text-white/80")} />
              <div>
                <p
                  className={cn(
                    "text-xs uppercase tracking-[0.3em]",
                    isLight ? "text-slate-500" : "text-white/50"
                  )}
                >
                  Rating
                </p>
                <p className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{ratingLabel}</p>
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex flex-wrap gap-3 text-xs",
            isLight ? "text-slate-600" : "text-white/70"
          )}
        >
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2",
              isLight ? "bg-slate-900/10" : "bg-white/15"
            )}
          >
            Live Leaderboard
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2",
              isLight ? "bg-slate-900/10" : "bg-white/15"
            )}
          >
            Bonus Rounds
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2",
              isLight ? "bg-slate-900/10" : "bg-white/15"
            )}
          >
            Coach Insights
          </span>
        </div>
      </div>

      <div
        className={cn(
          "relative flex min-h-[240px] flex-1 items-end overflow-hidden rounded-t-[2.75rem] md:rounded-l-[2.75rem] md:rounded-tr-none",
          isLight ? "bg-slate-100/60" : "bg-white/5"
        )}
      >
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
          <div
            className={cn(
              "flex h-full w-full items-center justify-center text-6xl",
              isLight
                ? "bg-gradient-to-br from-slate-200 to-transparent text-slate-400"
                : "bg-gradient-to-br from-white/15 to-transparent text-white/60"
            )}
          >
            🏆
          </div>
        )}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t",
            isLight
              ? "from-white/90 via-white/30 to-transparent"
              : "from-black/70 via-black/20 to-transparent"
          )}
        />

        <div
          className={cn(
            "relative w-full space-y-2 px-8 pb-10 md:px-10",
            isLight ? "text-slate-800" : "text-white"
          )}
        >
          <p
            className={cn(
              "text-xs uppercase tracking-[0.3em]",
              isLight ? "text-slate-500" : "text-white/60"
            )}
          >
            Featured Quiz
          </p>
          <p className="text-lg font-semibold">Unlock exclusive badges when you finish under the time cap.</p>
        </div>
      </div>
    </div>
  );
}
