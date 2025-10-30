"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseRatingStarsProps {
  averageRating: number; // 0-5
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ShowcaseRatingStars({ averageRating, totalReviews, size = "md", className }: ShowcaseRatingStarsProps) {
  const { theme } = useShowcaseTheme();

  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  } as const;

  const rounded = Math.round(averageRating);

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-[1rem] px-2 py-1 sm:px-3 sm:py-2", getSurfaceStyles(theme, "base"), className)}>
      <div className="flex items-center gap-0.5 text-yellow-400">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(sizes[size], index < rounded ? "fill-current" : "opacity-30")}
            fill={index < rounded ? "currentColor" : "none"}
          />
        ))}
      </div>
      <span className={cn("text-xs sm:text-sm font-medium", getTextColor(theme, "primary"))}>{averageRating.toFixed(1)}</span>
      {typeof totalReviews === "number" && (
        <span className={cn("text-[10px] sm:text-xs", getTextColor(theme, "muted"))}>({totalReviews})</span>
      )}
    </div>
  );
}


