"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import { Trophy, Zap } from "lucide-react";
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
  daily: "SOLAR CYCLE",
  "all-time": "ARCHIVE HALL",
};

const orderedRanges: LeaderboardRangeKey[] = ["daily", "all-time"];

export function ShowcaseLeaderboard({ title, datasets, initialRange = "daily", className }: ShowcaseLeaderboardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const availableRanges = useMemo(() => orderedRanges.filter((key) => (datasets[key]?.length ?? 0) > 0), [datasets]);
  const startingRange = availableRanges.includes(initialRange) ? initialRange : availableRanges[0] ?? "daily";
  const [activeRange, setActiveRange] = useState<LeaderboardRangeKey>(startingRange);

  const entries = datasets[activeRange] ?? [];
  const podium = [entries[1], entries[0], entries[2]].filter(Boolean);
  const rest = entries.slice(3);

  if (!mounted) return null;

  return (
    <div className={cn("relative mx-auto w-full max-w-[580px] group", className)}>
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 blur-3xl opacity-40 group-hover:opacity-70 transition-opacity rounded-[3.5rem]" />

      <div className="relative h-full w-full rounded-[3.5rem] glass-elevated border border-white/10 overflow-hidden flex flex-col pt-10 pb-14 px-6 sm:px-12 shadow-2xl">
        {/* Header Section */}
        <header className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
            <h2 className={cn("text-xs font-black uppercase tracking-[0.5em] text-center", getGradientText("neon"))}>
              {title}
            </h2>
            <div className="h-10 w-1 rounded-full bg-secondary shadow-neon-magenta" />
          </div>

          <div className="flex rounded-3xl glass border border-white/5 p-2">
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
                    "flex-1 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                    disabled && "opacity-10 cursor-not-allowed",
                    isActive && "bg-primary text-primary-foreground shadow-neon-cyan/50 scale-[1.05] z-10",
                    !isActive && !disabled && "text-muted-foreground hover:bg-white/5 hover:text-primary"
                  )}
                >
                  {rangeLabels[range]}
                </button>
              );
            })}
          </div>
        </header>

        {entries.length === 0 ? (
          <div className="mt-20 py-24 text-center space-y-6">
            <div className="h-24 w-24 mx-auto rounded-[2rem] glass border border-dashed border-white/10 flex items-center justify-center text-4xl text-white/5">
              <Zap className="h-12 w-12" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">NO SIGNAL DETECTED</p>
          </div>
        ) : (
          <>
            {/* Podium Section */}
            <div className="mt-14 mb-14 flex items-end justify-center gap-3 sm:gap-6 h-[260px] relative">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent blur-3xl -z-10" />
              {podium[0] && <PodiumItem entry={podium[0]} rank={2} height="h-[80%]" color="cyan" />}
              {podium[1] && <PodiumItem entry={podium[1]} rank={1} height="h-[100%]" color="magenta" isCenter />}
              {podium[2] && <PodiumItem entry={podium[2]} rank={3} height="h-[70%]" color="lime" />}
            </div>

            {/* List Section */}
            <div className="space-y-3">
              {rest.map((entry) => (
                <div key={entry.id} className="group/item flex items-center justify-between rounded-2xl glass border border-white/5 px-6 py-5 hover:border-primary/30 hover:bg-white/5 transition-all duration-500">
                  <div className="flex items-center gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl glass border border-white/5 text-[10px] font-black text-muted-foreground group-hover/item:text-primary transition-colors">
                      #{entry.position}
                    </div>
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white/5 group-hover/item:border-primary/40 transition-colors">
                      {entry.avatarUrl ? (
                        <Image src={entry.avatarUrl} alt={entry.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-white/5 flex items-center justify-center text-primary/10 font-black">ST</div>
                      )}
                    </div>
                    <div className="space-y-0.5 group-hover/item:translate-x-1 transition-transform">
                      <p className="text-sm font-black uppercase tracking-tight group-hover/item:text-primary transition-colors">{entry.name}</p>
                      <p className="text-[8px] font-black tracking-[0.3em] text-muted-foreground/40 uppercase">CERTIFIED CONTENDER</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black tracking-tighter text-primary">{entry.score.toLocaleString()}</p>
                    <p className="text-[8px] font-black tracking-widest text-muted-foreground/30 uppercase">SCORE UNITS</p>
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
    cyan: { bg: "bg-cyan-500", shadow: "shadow-neon-cyan/40", glow: "from-cyan-500/40", text: "text-cyan-400" },
    magenta: { bg: "bg-magenta-500", shadow: "shadow-neon-magenta/60", glow: "from-magenta-500/40", text: "text-magenta-400" },
    lime: { bg: "bg-lime-500", shadow: "shadow-neon-lime/40", glow: "from-lime-500/40", text: "text-lime-400" },
  }[color as 'cyan' | 'magenta' | 'lime'];

  return (
    <div className={cn("flex-1 flex flex-col items-center justify-end gap-6 transition-all duration-700", height)}>
      <div className="relative group/pod">
        <div className={cn(
          "relative h-16 w-16 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 backdrop-blur-3xl transition-all duration-700 shadow-xl",
          isCenter ? "h-24 w-24 sm:h-32 sm:w-32 scale-110 shadow-neon-magenta/20" : "",
          rank === 1 ? "border-magenta-500/40" : rank === 2 ? "border-cyan-500/40" : "border-lime-500/40"
        )}>
          {entry.avatarUrl ? (
            <Image src={entry.avatarUrl} alt={entry.name} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-white/5 flex items-center justify-center text-3xl sm:text-5xl opacity-40">
              {rank === 1 ? "👑" : rank === 2 ? "🚀" : "🔥"}
            </div>
          )}
        </div>

        <div className={cn("absolute -inset-4 rounded-full blur-2xl opacity-20 -z-10 bg-gradient-to-tr to-transparent", colorMap.glow)} />

        <div className={cn(
          "absolute -bottom-3 left-1/2 -translate-x-1/2 h-10 w-10 rounded-2xl glass border border-white/20 flex items-center justify-center text-sm font-black shadow-2xl transition-transform group-hover/pod:scale-110",
          colorMap.bg, colorMap.shadow, "text-white"
        )}>
          {rank}
        </div>
      </div>

      <div className="text-center space-y-1 group-hover/pod:translate-y-[-4px] transition-transform">
        <p className={cn("text-sm font-black uppercase tracking-tighter truncate max-w-[80px] sm:max-w-[120px]", rank === 1 ? "text-lg sm:text-2xl" : "")}>
          {entry.name}
        </p>
        <div className="flex items-center flex-col">
          <p className={cn("text-sm font-black tracking-widest", colorMap.text)}>{entry.score.toLocaleString()}</p>
          <p className="text-[8px] font-black tracking-widest text-muted-foreground/30 uppercase">UNITS</p>
        </div>
      </div>
    </div>
  );
}
