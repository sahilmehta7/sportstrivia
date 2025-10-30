"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseRatingBreakdownProps {
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  className?: string;
}

export function ShowcaseRatingBreakdown({ breakdown, className }: ShowcaseRatingBreakdownProps) {
  const { theme } = useShowcaseTheme();
  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0) || 1;

  return (
    <div className={cn("rounded-[1.5rem] p-4 sm:p-6", getSurfaceStyles(theme, "raised"), className)}>
      <h4 className={cn("mb-3 sm:mb-4 text-sm font-semibold", getTextColor(theme, "primary"))}>Rating Breakdown</h4>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown[star as 1 | 2 | 3 | 4 | 5] || 0;
          const percent = Math.round((count / total) * 100);
          return (
            <div key={star} className="flex items-center gap-3">
              <span className={cn("w-6 text-right text-[10px] sm:text-xs", getTextColor(theme, "muted"))}>{star}★</span>
              <div className="relative h-1.5 sm:h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-full bg-amber-400")}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className={cn("w-10 text-right text-[10px] sm:text-xs", getTextColor(theme, "muted"))}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


