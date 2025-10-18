"use client";

import { cn } from "@/lib/utils";

type StreakCardVariant = "light" | "dark";

interface ShowcaseDailyStreakCardProps {
  currentStreak: number;
  weekDays?: string[];
  completedDays?: number[];
  variant?: StreakCardVariant;
  className?: string;
}

const defaultWeekDays = ["M", "T", "W", "T", "F", "S", "S"];

export function ShowcaseDailyStreakCard({
  currentStreak,
  weekDays = defaultWeekDays,
  completedDays = [],
  variant = "light",
  className,
}: ShowcaseDailyStreakCardProps) {
  const displayedDays = weekDays.slice(0, 7);
  const isLight = variant === "light";

  return (
    <div
      className={cn(
        "flex w-full max-w-[360px] flex-col gap-6 rounded-[1.75rem] border p-6 shadow-lg",
        isLight
          ? "border-white/60 bg-white text-slate-900 shadow-[0_20px_50px_-25px_rgba(255,105,55,0.45)]"
          : "border-white/10 bg-gradient-to-br from-black/90 via-slate-950 to-black/90 text-white shadow-[0_20px_60px_-25px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500",
            isLight ? "shadow-lg shadow-amber-200/40" : "shadow-lg shadow-amber-500/40"
          )}
        >
          <span className="text-3xl">🔥</span>
        </div>
        <div>
          <div className="text-3xl font-bold tracking-tight">{currentStreak}</div>
          <p className={cn("text-sm capitalize", isLight ? "text-slate-500" : "text-white/60")}>day streak</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {displayedDays.map((day, index) => {
          const dayNumber = index + 1;
          const isCompleted = completedDays.includes(dayNumber);

          return (
            <div key={`${day}-${index}`} className="flex flex-col items-center gap-2 text-xs uppercase">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border",
                  isCompleted
                    ? "border-emerald-400 bg-emerald-400 text-white"
                    : isLight
                    ? "border-slate-200 bg-transparent text-slate-300"
                    : "border-white/15 bg-white/5 text-white/30"
                )}
              >
                {isCompleted ? "✓" : ""}
              </div>
              <span className={cn(isLight ? "text-slate-400" : "text-white/40")}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
