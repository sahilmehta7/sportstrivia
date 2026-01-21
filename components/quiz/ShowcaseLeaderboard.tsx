"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import { Trophy, Star, Crown, ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";

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
  daily: "DAILY ARENA",
  "all-time": "HALL OF FAME",
};

const orderedRanges: LeaderboardRangeKey[] = ["daily", "all-time"];

export function ShowcaseLeaderboard({ title, datasets, initialRange = "daily", className }: ShowcaseLeaderboardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const availableRanges = useMemo(() => orderedRanges.filter((key) => (datasets[key]?.length ?? 0) > 0), [datasets]);
  const startingRange = availableRanges.includes(initialRange) ? initialRange : availableRanges[0] ?? "daily";
  const [activeRange, setActiveRange] = useState<LeaderboardRangeKey>(startingRange);

  const entries = datasets[activeRange] ?? [];
  const podium = [entries[1], entries[0], entries[2]].filter(Boolean); // Order for visual layout: 2, 1, 3
  const rest = entries.slice(3);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[540px] overflow-hidden rounded-[3rem] p-[2px] shadow-glass-lg",
        "bg-gradient-to-br from-white/20 via-white/5 to-transparent",
        className
      )}
    >
      <div className="h-full w-full rounded-[2.9rem] glass-elevated overflow-hidden flex flex-col pt-8 pb-12 px-6 sm:px-10">

        {/* Header Section */}
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-full glass border border-white/10 flex items-center justify-center opacity-40">
              <Star className="h-4 w-4" />
            </div>
            <h2 className={cn(
              "text-xs font-black uppercase tracking-[0.4em] text-center",
              getGradientText("neon")
            )}>
              {title}
            </h2>
            <div className="h-10 w-10 rounded-full glass border border-white/10 flex items-center justify-center opacity-40">
              <Trophy className="h-4 w-4" />
            </div>
          </div>

          {/* Range Toggle */}
          <div className="flex rounded-2xl glass border border-white/5 p-1.5">
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
                    "flex-1 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    disabled && "opacity-20 cursor-not-allowed",
                    isActive && "bg-primary text-primary-foreground shadow-neon-cyan/40 scale-[1.02]",
                    !isActive && !disabled && "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  {rangeLabels[range]}
                </button>
              );
            })}
          </div>
        </header>

        {entries.length === 0 ? (
          <div className="mt-16 py-20 text-center space-y-4">
            <div className="h-20 w-20 mx-auto rounded-full glass border border-dashed border-white/20 flex items-center justify-center text-4xl opacity-20">
              🏆
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">The Arena is Empty</p>
          </div>
        ) : (
          <>
            {/* Podium Section */}
            <div className="mt-12 mb-10 flex items-end justify-center gap-2 sm:gap-4 h-[240px]">
              {/* Rank 2 */}
              {podium[0] && (
                <PodiumItem
                  entry={podium[0]}
                  rank={2}
                  height="h-[75%]"
                  color="cyan"
                />
              )}

              {/* Rank 1 (Champion) */}
              {podium[1] && (
                <PodiumItem
                  entry={podium[1]}
                  rank={1}
                  height="h-[100%]"
                  color="magenta"
                  isCenter
                />
              )}

              {/* Rank 3 */}
              {podium[2] && (
                <PodiumItem
                  entry={podium[2]}
                  rank={3}
                  height="h-[65%]"
                  color="lime"
                />
              )}
            </div>

            {/* List Section */}
            <div className="space-y-3">
              {rest.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="group flex items-center justify-between rounded-2xl glass border border-white/5 px-6 py-4 hover:border-white/20 hover:bg-white/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl glass border border-white/5 text-[10px] font-black text-muted-foreground group-hover:text-foreground transition-colors">
                      #{entry.position}
                    </div>
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/10">
                      {entry.avatarUrl ? (
                        <Image src={entry.avatarUrl} alt={entry.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-white/5" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-black uppercase tracking-tight">{entry.name}</p>
                      <p className="text-[8px] font-bold tracking-widest text-muted-foreground">TOP CONTENDER</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tracking-widest text-primary">{entry.score.toLocaleString()}</p>
                    <p className="text-[8px] font-bold tracking-widest text-muted-foreground">PTS</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PodiumItem({ entry, rank, height, color, isCenter = false }: { entry: LeaderboardEntry, rank: number, height: string, color: string, isCenter?: boolean }) {
  const colorMap = {
    cyan: "from-cyan-500 shadow-neon-cyan/20 border-cyan-500/30",
    magenta: "from-magenta-500 shadow-neon-magenta/40 border-magenta-500/40",
    lime: "from-lime-500 shadow-neon-lime/20 border-lime-500/30",
  }[color as 'cyan' | 'magenta' | 'lime'];

  return (
    <div className={cn(
      "flex-1 flex flex-col items-center justify-end gap-4 pb-6 transition-all duration-500 hover:scale-[1.05]",
      height
    )}>
      <div className="relative group">
        <div className={cn(
          "relative h-14 w-14 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 sm:border-4 backdrop-blur-xl transition-all duration-500",
          isCenter ? "h-20 w-20 sm:h-28 sm:w-28 scale-110" : "",
          colorMap.split(' ')[2]
        )}>
          {entry.avatarUrl ? (
            <Image src={entry.avatarUrl} alt={entry.name} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-white/5 flex items-center justify-center text-2xl sm:text-4xl">
              {rank === 1 ? "👑" : rank === 2 ? "🚀" : "🔥"}
            </div>
          )}
        </div>

        {/* Glow Effect */}
        <div className={cn(
          "absolute -inset-2 rounded-full blur-[12px] opacity-40 -z-10 bg-gradient-to-tr to-transparent",
          colorMap.split(' ')[0]
        )} />

        {/* Rank Badge */}
        <div className={cn(
          "absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 sm:h-10 sm:w-10 rounded-full glass border border-white/20 flex items-center justify-center text-[10px] sm:text-sm font-black shadow-lg",
          rank === 1 ? "bg-magenta-500 text-white shadow-neon-magenta/40" :
            rank === 2 ? "bg-cyan-500 text-white shadow-neon-cyan/40" :
              "bg-lime-500 text-white shadow-neon-lime/40"
        )}>
          {rank}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className={cn(
          "text-[10px] sm:text-xs font-black uppercase tracking-tighter line-clamp-1",
          rank === 1 ? "text-lg sm:text-xl" : ""
        )}>
          {entry.name}
        </p>
        <div className="flex items-center flex-col">
          <p className={cn(
            "text-[10px] sm:text-xs font-black tracking-widest",
            rank === 1 ? "text-magenta-400" : rank === 2 ? "text-cyan-400" : "text-lime-400"
          )}>
            {entry.score.toLocaleString()}
          </p>
          <p className="text-[8px] font-bold tracking-widest text-muted-foreground opacity-60">PTS</p>
        </div>
      </div>
    </div>
  );
}
