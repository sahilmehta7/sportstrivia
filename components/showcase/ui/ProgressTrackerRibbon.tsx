"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ProgressTrackerRibbonProps {
  label: string;
  current: number;
  goal: number;
  milestoneLabel?: string;
  className?: string;
}

export function ShowcaseProgressTrackerRibbon({ label, current, goal, milestoneLabel = "Next tier", className }: ProgressTrackerRibbonProps) {
  const { theme } = useShowcaseTheme();
  const progress = Math.min(Math.max(current / goal, 0), 1);

  return (
    <div className={cn("rounded-[2rem] px-6 py-4", getSurfaceStyles(theme, "raised"), className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-xs uppercase tracking-[0.3em]", getTextColor(theme, "muted"))}>{label}</p>
          <h4 className={cn("text-lg font-black", getTextColor(theme, "primary"))}>{current} / {goal}</h4>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
          {milestoneLabel}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
