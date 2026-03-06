"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShowcaseReviewsPanel } from "@/components/showcase/ui";
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
      <ShowcaseReviewsPanel
        reviews={reviews}
        className="bg-transparent"
        onAddReview={() => setIsOpen(true)}
      />

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
