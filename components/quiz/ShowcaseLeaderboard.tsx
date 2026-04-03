"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import {  Zap } from "lucide-react";
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
  const getInitial = (name?: string) => {
    const trimmed = name?.trim();
    return trimmed?.charAt(0).toUpperCase() || "?";
  };

  if (!mounted) return null;

  return (
    <div className={cn("relative mx-auto w-full max-w-[680px]", className)}>
      <div className="relative h-full w-full flex flex-col gap-6 sm:gap-8 px-1 sm:px-2">
        {/* Header Section */}
        <header className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
            <h2 className={cn("text-xs font-black uppercase tracking-[0.5em] text-center", getGradientText("neon"))}>
              {title}
            </h2>
            <div className="h-10 w-1 rounded-full bg-secondary shadow-neon-magenta" />
          </div>

          <div className="inline-flex w-full rounded-xl bg-muted/60 p-1">
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
                    "flex-1 rounded-lg px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                    disabled && "opacity-30 cursor-not-allowed",
                    isActive && "bg-primary text-primary-foreground shadow",
                    !isActive && !disabled && "text-foreground/85 hover:bg-background/80"
                  )}
                >
                  {rangeLabels[range]}
                </button>
              );
            })}
          </div>
        </header>

        {entries.length === 0 ? (
          <div className="mt-8 py-12 text-center space-y-4">
            <div className="control-public h-24 w-24 mx-auto glass border border-dashed border-white/10 flex items-center justify-center text-4xl text-white/5">
              <Zap className="h-12 w-12" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">NO SIGNAL DETECTED</p>
          </div>
        ) : (
          <>
            {/* Podium Section */}
            <div className="mt-2 mb-4 flex items-end justify-center gap-3 sm:gap-5 h-[220px] relative">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent blur-3xl -z-10" />
              {podium[0] && <PodiumItem entry={podium[0]} rank={2} height="h-[80%]" color="cyan" />}
              {podium[1] && <PodiumItem entry={podium[1]} rank={1} height="h-[100%]" color="magenta" isCenter />}
              {podium[2] && <PodiumItem entry={podium[2]} rank={3} height="h-[70%]" color="lime" />}
            </div>

            {/* List Section */}
            <div className="divide-y divide-border/50">
              {rest.map((entry) => (
                <div key={entry.id} className="group/item flex items-center justify-between py-2.5 sm:py-3">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="w-8 text-xs font-black text-muted-foreground">#{entry.position}</div>
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/10 group-hover/item:border-primary/40 transition-colors">
                      {entry.avatarUrl ? (
                        <AvatarImage src={entry.avatarUrl} alt={entry.name} fallback={getInitial(entry.name)} />
                      ) : (
                        <div className="h-full w-full bg-primary/15 flex items-center justify-center text-sm font-black text-primary">
                          {getInitial(entry.name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase tracking-tight group-hover/item:text-primary transition-colors">{entry.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black tracking-tight text-primary">{entry.score.toLocaleString()}</p>
                    <p className="text-[9px] font-black tracking-wider text-muted-foreground/70 uppercase">XP</p>
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
    <div className={cn("flex-1 flex flex-col items-center justify-end gap-3 transition-all duration-700", height)}>
      <div className="relative group/pod">
        <p className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-black tracking-wider text-foreground/85">
          #{rank}
        </p>
        <div className={cn(
          "relative h-16 w-16 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 backdrop-blur-3xl transition-all duration-700 shadow-xl",
          isCenter ? "h-24 w-24 sm:h-32 sm:w-32 scale-110 shadow-neon-magenta/20" : "",
          rank === 1 ? "border-magenta-500/40" : rank === 2 ? "border-cyan-500/40" : "border-lime-500/40"
        )}>
          {entry.avatarUrl ? (
            <AvatarImage src={entry.avatarUrl} alt={entry.name} fallback={entry.name?.trim()?.charAt(0).toUpperCase() || "?"} />
          ) : (
            <div className="h-full w-full bg-primary/15 flex items-center justify-center text-3xl sm:text-5xl font-black text-primary">
              {entry.name?.trim()?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>

        <div className={cn("absolute -inset-4 rounded-full blur-2xl opacity-20 -z-10 bg-gradient-to-tr to-transparent", colorMap.glow)} />
      </div>

      <div className="text-center space-y-0.5 group-hover/pod:translate-y-[-4px] transition-transform">
        <p className={cn("text-sm font-black uppercase tracking-tighter truncate max-w-[80px] sm:max-w-[120px]", rank === 1 ? "text-lg sm:text-2xl" : "")}>
          {entry.name}
        </p>
        <div className="flex items-center flex-col">
          <p className={cn("text-sm font-black tracking-widest", colorMap.text)}>{entry.score.toLocaleString()}</p>
          <p className="text-[8px] font-black tracking-widest text-muted-foreground/70 uppercase">XP</p>
        </div>
      </div>
    </div>
  );
}

function AvatarImage({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div className="h-full w-full bg-primary/15 flex items-center justify-center text-sm sm:text-3xl font-black text-primary">
        {fallback}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}
