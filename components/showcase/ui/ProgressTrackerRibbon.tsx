"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getTextColor } from "@/lib/showcase-theme";
// Intentionally not using Card wrapper here so we can exactly match the
// requested class list for background/shadow behavior.

interface ProgressTrackerRibbonProps {
  label: string;
  current: number;
  goal: number;
  milestoneLabel?: string;
  className?: string;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  rightTitle?: string; // e.g., "Level"
  rightValue?: string | number; // e.g., 13
  compact?: boolean; // compact number formatting like 7.6k
}

export function ShowcaseProgressTrackerRibbon({ label, current, goal, milestoneLabel = "Next tier", className, footerLeft, footerRight, rightTitle, rightValue, compact = true }: ProgressTrackerRibbonProps) {
  const { theme } = useShowcaseTheme();
  const progress = Math.min(Math.max(current / goal, 0), 1);

  const fmt = (n: number) =>
    compact ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n) : String(n);

  return (
    <div
      className={cn(
        // Exact class list requested to match other cards + stronger hover shadow
        "text-card-foreground relative overflow-hidden rounded-[1.75rem] border shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-card/60 backdrop-blur-md border-border/60",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="relative p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={cn("text-[10px] sm:text-xs uppercase tracking-[0.35em]", getTextColor(theme, "muted"))}>{label}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h4 className={cn("text-2xl sm:text-3xl font-extrabold leading-none", getTextColor(theme, "primary"))}>
              {fmt(current)}
            </h4>
            <span className={cn("text-base sm:text-lg font-extrabold", getTextColor(theme, "muted"))}>/ {fmt(goal)}</span>
          </div>
        </div>

        <div className="sm:text-right">
          {rightTitle && (
            <p className={cn("text-[10px] sm:text-xs uppercase tracking-[0.35em]", getTextColor(theme, "muted"))}>{rightTitle}</p>
          )}
          {rightValue !== undefined && (
            <div className={cn("mt-1 text-lg sm:text-2xl font-extrabold", getTextColor(theme, "primary"))}>{rightValue}</div>
          )}
          {!rightTitle && milestoneLabel && (
            <span className={cn("mt-1 inline-block rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
              {milestoneLabel}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${progress * 100}%` }} />
      </div>
      {(footerLeft || footerRight) && (
        <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
          <div className={cn(getTextColor(theme, "muted"))}>{footerLeft}</div>
          <div className={cn(getTextColor(theme, "muted"))}>{footerRight}</div>
        </div>
      )}
      </div>
    </div>
  );
}
