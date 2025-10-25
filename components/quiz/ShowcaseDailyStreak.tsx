"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";

interface DailyStreakProps {
  currentStreak: number;
  bestStreak?: number;
  weekDays?: string[];
  completedDays?: number[];
  message?: string;
  className?: string;
}

const defaultWeekDays = ["M", "T", "W", "T", "F", "S", "S"];

export function ShowcaseDailyStreak({
  currentStreak,
  bestStreak,
  weekDays = defaultWeekDays,
  completedDays = [],
  message = "You're on fire!",
  className,
}: DailyStreakProps) {
  const { theme } = useShowcaseTheme();
  const displayedDays = weekDays.slice(0, 7);

  return (
    <div
      className={cn(
        "relative flex w-full max-w-[320px] flex-col items-center overflow-hidden rounded-[2.5rem] border p-8 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.85)]",
        getGlassCard(theme),
        className
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,140,0,0.25),_transparent_65%)]" />

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-[0_20px_45px_rgba(255,120,0,0.35)]">
        <span className="text-3xl">🔥</span>
      </div>

      <div className={cn("mt-6 text-5xl font-bold tracking-tight", getTextColor(theme, "primary"))}>{currentStreak}</div>
      <p className={cn("mt-1 text-sm uppercase tracking-[0.35em]", getAccentColor(theme, "warning"))}>Days Streak</p>

      <div className="mt-8 w-full rounded-3xl border border-white/10 bg-black/40 px-5 py-4 text-sm">
        <div className={cn("flex justify-between text-xs uppercase tracking-[0.35em]", getTextColor(theme, "muted"))}>
          {displayedDays.map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>

        <div className="mt-3 flex justify-between">
          {displayedDays.map((day, index) => {
            const dayNumber = index + 1;
            const isCompleted = completedDays.includes(dayNumber);
            const isToday = dayNumber === displayedDays.length && !isCompleted;

            return (
              <div
                key={`${day}-status-${index}`}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-xs transition",
                  isCompleted
                    ? "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-slate-900"
                    : "bg-black/40 text-white/40",
                  isToday && !isCompleted && "border-dashed border-white/40"
                )}
              >
                {isCompleted ? "✓" : dayNumber}
              </div>
            );
          })}
        </div>
      </div>

      {typeof bestStreak === "number" && (
        <p className={cn("mt-4 text-xs", getTextColor(theme, "muted"))}>Best streak: {bestStreak} days</p>
      )}

      <div className={cn("mt-6 w-full rounded-3xl border border-white/10 bg-black/50 px-5 py-3 text-center text-sm font-semibold", getTextColor(theme, "secondary"))}>
        {message} 🔥
      </div>
    </div>
  );
}
