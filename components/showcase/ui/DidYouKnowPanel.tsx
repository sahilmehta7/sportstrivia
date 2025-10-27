"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface DidYouKnowPanelProps {
  fact: string;
  sourceLabel?: string;
  className?: string;
}

export function ShowcaseDidYouKnowPanel({ fact, sourceLabel = "Powered by Quizverse stats", className }: DidYouKnowPanelProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div className={cn("flex flex-col gap-3 rounded-[1.75rem] px-5 py-4", getSurfaceStyles(theme, "sunken"), className)}>
      <span className="text-2xl" aria-hidden="true">
        💡
      </span>
      <p className={cn("text-sm font-semibold", getTextColor(theme, "primary"))}>{fact}</p>
      <span className={cn("text-[10px] uppercase tracking-[0.3em]", getTextColor(theme, "muted"))}>{sourceLabel}</span>
    </div>
  );
}
