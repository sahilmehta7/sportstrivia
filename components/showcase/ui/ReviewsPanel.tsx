"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShowcaseReviewCard } from "@/components/showcase/ui/ReviewCard";
import { ShowcaseEmptyState } from "@/components/showcase/ui/EmptyState";
import { trackEvent } from "@/lib/analytics";
import { MessageSquarePlus } from "lucide-react";

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
  const canAddReview = typeof onAddReview === "function";

  const handleAdd = () => {
    trackEvent("review_submit", { action: "open_modal" });
    onAddReview?.();
  };

  const safeReviews = Array.isArray(reviews) ? reviews : [];

  if (safeReviews.length === 0) {
    return (
      <ShowcaseEmptyState
        icon="💬"
        title="BE THE FIRST TO COMMENT"
        description="This arena has no records yet. Share your experience with the community."
        {...(canAddReview ? { actionLabel: "DEPLOY REVIEW", onAction: handleAdd } : {})}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-10", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 rounded-full bg-primary shadow-neon-cyan" />
            <h4 className="text-2xl font-black uppercase tracking-tight">Transmission Feed</h4>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pl-5">
            {safeReviews.length} Community Logs Available
          </p>
        </div>

        {canAddReview && (
          <Button
            variant="glass"
            size="sm"
            className="rounded-2xl border-white/10 hover:border-primary/40 hover:text-primary transition-all pr-6"
            onClick={handleAdd}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            ADD LOG
          </Button>
        )}
      </div>

      <div className="grid gap-6">
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
