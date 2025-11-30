"use client";

import { useState } from "react";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
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
      <ShowcaseButton
        variant="outline"
        size="md"
        onClick={() => setIsOpen(true)}
        ariaLabel="Rate this quiz"
      >
        Rate This Quiz
      </ShowcaseButton>

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


