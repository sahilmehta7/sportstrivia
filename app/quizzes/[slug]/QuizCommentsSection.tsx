"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { MessageSquarePlus } from "lucide-react";
import { ReviewModal } from "@/components/quiz/ReviewModal";

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

interface QuizCommentsSectionProps {
  quizSlug: string;
  quizTitle: string;
  reviews: ReviewItem[];
}

export function QuizCommentsSection({
  quizSlug,
  quizTitle,
  reviews,
}: QuizCommentsSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-foreground/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold uppercase tracking-tight">Community Reviews</h3>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {reviews.length} community logs
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Add review
          </Button>
        </div>

        {reviews.length > 0 ? (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <Card key={review.id} className="rounded-lg border-border/60 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar src={review.reviewer.avatarUrl} alt={review.reviewer.name} size="md" />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold">{review.reviewer.name}</p>
                        <StarRating value={review.rating} readonly size="sm" />
                        {review.dateLabel ? (
                          <span className="text-xs text-muted-foreground">{review.dateLabel}</span>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.quote}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-lg border-border/60 bg-card">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No reviews yet. Be the first to share feedback on this quiz.
            </CardContent>
          </Card>
        )}
      </section>

      {isOpen ? (
        <ReviewModal
          quizSlug={quizSlug}
          quizTitle={quizTitle}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            router.refresh();
            setIsOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
