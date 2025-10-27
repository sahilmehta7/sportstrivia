"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";

export type LeaderboardRangeKey = "daily" | "all-time";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  avatarUrl?: string | null;
  position: number;
}

interface ShowcaseLeaderboardProps {
  title: string;
  datasets: Record<LeaderboardRangeKey, LeaderboardEntry[]>;
  initialRange?: LeaderboardRangeKey;
  className?: string;
}

const rangeLabels: Record<LeaderboardRangeKey, string> = {
  daily: "Today",
  "all-time": "All Time",
};

const orderedRanges: LeaderboardRangeKey[] = ["daily", "all-time"];

export function ShowcaseLeaderboard({ title, datasets, initialRange = "daily", className }: ShowcaseLeaderboardProps) {
  const { theme: themeMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to dark theme until mounted to prevent hydration mismatch
  const theme = mounted && themeMode === "light" ? "light" : "dark";

  const availableRanges = useMemo(() => orderedRanges.filter((key) => (datasets[key]?.length ?? 0) > 0), [datasets]);
  const startingRange = availableRanges.includes(initialRange) ? initialRange : availableRanges[0] ?? "daily";
  const [activeRange, setActiveRange] = useState<LeaderboardRangeKey>(startingRange);

  const entries = datasets[activeRange] ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podiumOrder = [1, 0, 2];

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[2.5rem] border p-6 shadow-[0_40px_120px_-40px_rgba(18,18,32,0.9)]",
        getGlassCard(theme),
        className
      )}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-400/15 via-transparent to-transparent" />
      <div className="absolute inset-x-0 top-10 -z-10 h-48 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.12),_transparent_60%)]" />

      <header className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20"
        >
          ←
        </button>
        <div className="text-center">
          <h2 className={cn("text-sm font-semibold uppercase tracking-[0.35em]", getTextColor(theme, "secondary"))}>{title}</h2>
        </div>
        <div className="h-10 w-10" />
      </header>

      <div className={cn("mt-6 flex rounded-full bg-white/10 p-1 text-xs font-semibold uppercase tracking-[0.2em]", getTextColor(theme, "muted"))}>
        {orderedRanges.map((range) => {
          const disabled = (datasets[range]?.length ?? 0) === 0;
          const isActive = activeRange === range;
          return (
            <button
              key={range}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setActiveRange(range)}
              className={cn(
                "flex-1 rounded-full px-4 py-2 text-center transition",
                disabled && "cursor-not-allowed opacity-40",
                !disabled && "hover:bg-white/10",
                isActive && !disabled && "bg-gradient-to-r from-amber-400 to-pink-500 text-slate-900"
              )}
            >
              {rangeLabels[range]}
            </button>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <div className={cn("mt-10 rounded-3xl bg-slate-950/60 p-8 text-center text-sm", getTextColor(theme, "muted"))}>
          No leaderboard data available for this range.
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-3 items-end gap-3">
            {podiumOrder.map((podiumIndex) => {
              const entry = podium[podiumIndex];
              if (!entry) {
                return <div key={`empty-${podiumIndex}`} className="h-32 rounded-3xl bg-slate-950/40" />;
              }

              const isChampion = entry.position === 1;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex h-full flex-col items-center justify-end gap-3 rounded-3xl bg-slate-950/60 p-4 backdrop-blur",
                    isChampion ? "pb-6" : "pb-4"
                  )}
                >
                  <div
                    className={cn(
                      "relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white/40 bg-black/40",
                      isChampion ? "h-24 w-24 border-amber-300/90" : ""
                    )}
                  >
                    {entry.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.avatarUrl} alt={entry.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl">{isChampion ? "👑" : "🏆"}</span>
                    )}
                    <span
                      className={cn(
                        "absolute -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 text-sm font-bold",
                        isChampion ? "bg-amber-300 text-slate-900" : "bg-white/20"
                      )}
                    >
                      {entry.position}
                    </span>
                  </div>
                  <div className={cn("text-center text-sm font-semibold", getTextColor(theme, "primary"))}>{entry.name}</div>
                  <div className={cn("text-xs font-bold", getAccentColor(theme, "primary"))}>{entry.score.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-3">
            {rest.map((entry) => (
              <div
                key={entry.id}
                className={cn("flex items-center justify-between rounded-3xl bg-slate-950/70 px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]", getTextColor(theme, "secondary"))}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold", getTextColor(theme, "muted"))}>
                    {entry.position}
                  </span>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <span className={getAccentColor(theme, "primary")}>
                  {entry.score.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
