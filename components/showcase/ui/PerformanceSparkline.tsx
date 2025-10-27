"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface PerformanceSparklineProps {
  label: string;
  values: number[];
  min?: number;
  max?: number;
  className?: string;
}

export function ShowcasePerformanceSparkline({ label, values, min, max, className }: PerformanceSparklineProps) {
  const { theme } = useShowcaseTheme();

  if (!values.length) return null;

  const actualMin = min ?? Math.min(...values);
  const actualMax = max ?? Math.max(...values);
  const range = actualMax - actualMin || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - actualMin) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={cn("rounded-[1.75rem] p-4", getSurfaceStyles(theme, "base"), className)}>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
        <span className={getTextColor(theme, "secondary")}>{label}</span>
        <span className={cn("font-semibold", getTextColor(theme, "primary"))}>{values[values.length - 1]}</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-16 w-full">
        <polyline
          fill="none"
          stroke="url(#sparkGradient)"
          strokeWidth={3}
          strokeLinecap="round"
          points={points}
        />
        <defs>
          <linearGradient id="sparkGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#fb923c" stopOpacity={theme === "light" ? 0.4 : 0.7} />
            <stop offset="100%" stopColor="#ec4899" stopOpacity={theme === "light" ? 0.6 : 0.9} />
          </linearGradient>
        </defs>
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-white/60">
        <span>{actualMin}</span>
        <span>{actualMax}</span>
      </div>
    </div>
  );
}
