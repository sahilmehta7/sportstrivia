"use client";

import { useState } from "react";
import { ReviewCard } from "./ReviewCard";
import { ReviewModal } from "./ReviewModal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewsListProps {
  quizSlug: string;
  quizTitle: string;
  initialReviews: Review[];
  initialTotal: number;
  initialPage: number;
  currentUserId?: string;
}

export function ReviewsList({
  quizSlug,
  quizTitle,
  initialReviews,
  initialTotal,
  initialPage,
  currentUserId,
}: ReviewsListProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const hasMore = reviews.length < total;
  const limit = 10;

  const loadMore = async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `/api/quizzes/${quizSlug}/reviews?page=${nextPage}&limit=${limit}`
      );
      const result = await response.json();

      if (response.ok) {
        setReviews([...reviews, ...result.data.reviews]);
        setPage(nextPage);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    // Optimistic update
    setReviews(reviews.filter((r) => r.id !== reviewId));
    setTotal(total - 1);

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      toast({
        title: "Success",
        description: "Your review has been deleted",
      });
    } catch (error) {
      // Revert on error
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
      // Reload reviews
      window.location.reload();
    }
  };

  const handleEditSuccess = () => {
    setEditingReview(null);
    // Reload reviews to show updated data
    window.location.reload();
  };

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No reviews yet"
        description="Be the first to review this quiz!"
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            onEdit={() => setEditingReview(review)}
            onDelete={() => handleDelete(review.id)}
          />
        ))}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="min-w-[200px]"
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Loading...</span>
                </>
              ) : (
                "Load More Reviews"
              )}
            </Button>
          </div>
        )}
      </div>

      {editingReview && (
        <ReviewModal
          quizSlug={quizSlug}
          quizTitle={quizTitle}
          isOpen={true}
          onClose={() => setEditingReview(null)}
          onSuccess={handleEditSuccess}
          existingReview={{
            id: editingReview.id,
            rating: editingReview.rating,
            comment: editingReview.comment,
          }}
        />
      )}
    </>
  );
}

