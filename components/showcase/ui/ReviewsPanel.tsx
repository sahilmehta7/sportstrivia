"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";
import { ShowcaseReviewCard } from "@/components/showcase/ui/ReviewCard";
import { ShowcaseEmptyState } from "@/components/showcase/ui/EmptyState";

interface ReviewItem {
  id: string;
  reviewer: {
    name: string;
    avatarUrl?: string | null;
    role?: string;
  };
  rating: number;
  quote: string;
  dateLabel?: string;
}

interface ShowcaseReviewsPanelProps {
  reviews: ReviewItem[];
  onAddReview?: () => void;
  className?: string;
}

export function ShowcaseReviewsPanel({ reviews, onAddReview, className }: ShowcaseReviewsPanelProps) {
  const { theme } = useShowcaseTheme();
  const canAddReview = typeof onAddReview === "function";

  const handleAdd = () => {
    onAddReview?.();
  };

  // Ensure reviews is always an array
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  if (safeReviews.length === 0) {
    return (
      <ShowcaseEmptyState
        icon="💬"
        title="No reviews yet"
        description="Be the first to share your thoughts about this quiz."
        {...(canAddReview ? { actionLabel: "Add a review", onAction: handleAdd } : {})}
        className={className}
      />
    );
  }

  return (
    <div className={cn("rounded-[1.5rem] p-4 sm:p-6", getSurfaceStyles(theme, "base"), className)}>
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
        <h4 className={cn("text-sm sm:text-base font-semibold", getTextColor(theme, "primary"))}>Reviews ({safeReviews.length})</h4>
        {canAddReview && (
          <Button size="sm" className="rounded-full" onClick={handleAdd}>
            Add review
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {safeReviews.map((r) => (
          <ShowcaseReviewCard
            key={r.id}
            reviewer={r.reviewer}
            rating={r.rating}
            quote={r.quote}
            dateLabel={r.dateLabel}
          />)
        )}
      </div>
    </div>
  );
}
