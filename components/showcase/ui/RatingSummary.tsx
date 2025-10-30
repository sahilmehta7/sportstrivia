"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";
import { ShowcaseRatingStars } from "@/components/showcase/ui/RatingStars";

interface ShowcaseRatingSummaryProps {
  averageRating: number; // 0-5
  totalReviews?: number;
  className?: string;
}

export function ShowcaseRatingSummary({ averageRating, totalReviews, className }: ShowcaseRatingSummaryProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div className={cn(
      "rounded-[1.5rem] p-4 sm:p-6",
      getSurfaceStyles(theme, "raised"),
      className
    )}>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn("text-sm font-semibold", getTextColor(theme, "primary"))}>Ratings Summary</p>
          <p className={cn("mt-1 text-2xl font-bold sm:text-3xl", getTextColor(theme, "primary"))}>{averageRating.toFixed(1)} / 5</p>
          {typeof totalReviews === "number" && (
            <p className={cn("text-xs sm:text-sm", getTextColor(theme, "muted"))}>{totalReviews} reviews</p>
          )}
        </div>
        <ShowcaseRatingStars
          averageRating={averageRating}
          totalReviews={totalReviews}
          size="lg"
          className="w-full sm:w-auto justify-between sm:justify-start"
        />
      </div>
    </div>
  );
}


