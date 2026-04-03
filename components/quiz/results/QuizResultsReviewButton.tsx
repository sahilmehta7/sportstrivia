"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReviewModal } from "@/components/quiz/ReviewModal";

interface QuizResultsReviewButtonProps {
  quizSlug: string;
  quizTitle: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

export function QuizResultsReviewButton({
  quizSlug,
  quizTitle,
  existingReview,
}: QuizResultsReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reviewDraft] = useState(existingReview ?? null);

  return (
    <>
      <Button
        variant="outline"
        size="default"
        onClick={() => setIsOpen(true)}
        aria-label="Rate this quiz"
      >
        Rate This Quiz
      </Button>

      {isOpen ? (
        <ReviewModal
          quizSlug={quizSlug}
          quizTitle={quizTitle}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
          }}
          existingReview={reviewDraft ?? undefined}
        />
      ) : null}
    </>
  );
}
