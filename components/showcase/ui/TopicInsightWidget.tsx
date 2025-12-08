"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getChipStyles } from "@/lib/showcase-theme";

interface TopicInsightWidgetProps {
  title: string;
  totalQuizzes: number;
  followers: number;
  accuracyPercent?: number;
  breakdown?: Array<{ label: string; value: number }>;
  className?: string;
}

export function ShowcaseTopicInsightWidget({
  title,
  totalQuizzes,
  followers,
  accuracyPercent = 72,
  breakdown = [],
  className,
}: TopicInsightWidgetProps) {
  /* Removed unused theme logic */

  const textPrimary = getTextColor("primary");
  const textSecondary = getTextColor("secondary");

  return (
    <div className={cn("rounded-[2rem] p-5", getSurfaceStyles("raised"), className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className={cn("text-lg font-bold", textPrimary)}>{title}</h3>
          <p className={cn("text-xs uppercase tracking-[0.3em]", textSecondary)}>Topic Insights</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]", getChipStyles("outline"))}>
          {totalQuizzes} quizzes
        </span>
      </div>

      <div className="grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className={textSecondary}>Followers</span>
          <span className={textPrimary}>{followers.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={textSecondary}>Avg Accuracy</span>
          <span className={cn("font-semibold", textPrimary)}>{accuracyPercent}%</span>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="mt-5 space-y-3">
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className={textSecondary}>{item.label}</span>
                <span className={textPrimary}>{item.value}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
