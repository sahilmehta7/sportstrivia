"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getChipStyles } from "@/lib/showcase-theme";

export interface MiniLeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface ShowcaseMiniLeaderboardProps {
  entries: MiniLeaderboardEntry[];
  title?: string;
  className?: string;
}

export function ShowcaseMiniLeaderboard({ entries, title = "Top Players", className }: ShowcaseMiniLeaderboardProps) {
  const { theme } = useShowcaseTheme();

  if (!entries.length) return null;

  return (
    <div className={cn("rounded-[2rem] p-5", getSurfaceStyles(theme, "raised"), className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className={cn("text-sm font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>{title}</h3>
        <span className={cn("rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]", getChipStyles(theme, "ghost"))}>
          Live
        </span>
      </div>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={entry.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", getChipStyles(theme, "outline"))}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={cn("text-sm font-medium", getTextColor(theme, "primary"))}>{entry.name}</span>
            </div>
            <span className={cn("text-sm font-semibold", getTextColor(theme, "secondary"))}>{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
