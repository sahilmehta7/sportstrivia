"use client";

import { useState } from "react";
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
  const [localReviews, setLocalReviews] = useState(reviews);

  const handleAdd = () => {
    if (onAddReview) return onAddReview();
    // Demo add: append a mock review
    setLocalReviews((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        reviewer: { name: "New Reviewer" },
        rating: 5,
        quote: "Fantastic quiz! The questions were challenging and fun.",
        dateLabel: "Just now",
      },
    ]);
  };

  if (localReviews.length === 0) {
    return (
      <ShowcaseEmptyState
        icon="💬"
        title="No reviews yet"
        description="Be the first to share your thoughts about this quiz."
        actionLabel="Add a review"
        onAction={handleAdd}
        className={className}
      />
    );
  }

  return (
    <div className={cn("rounded-[1.5rem] p-4 sm:p-6", getSurfaceStyles(theme, "base"), className)}>
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
        <h4 className={cn("text-sm sm:text-base font-semibold", getTextColor(theme, "primary"))}>Reviews ({localReviews.length})</h4>
        <Button size="sm" className="rounded-full" onClick={handleAdd}>
          Add review
        </Button>
      </div>
      <div className="space-y-4">
        {localReviews.map((r) => (
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


