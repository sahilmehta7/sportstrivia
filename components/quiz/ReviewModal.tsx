"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";
import { useToast } from "@/hooks/use-toast";

interface ReviewModalProps {
  quizSlug: string;
  quizTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  };
}

export function ReviewModal({
  quizSlug,
  quizTitle,
  isOpen,
  onClose,
  onSuccess,
  existingReview,
}: ReviewModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [existingReview, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const url = existingReview
        ? `/api/reviews/${existingReview.id}`
        : `/api/quizzes/${quizSlug}/reviews`;

      const method = existingReview ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit review");
      }

      toast({
        title: "Success",
        description: existingReview
          ? "Your review has been updated"
          : "Thank you for your review!",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Edit Your Review" : "Rate This Quiz"}
          </DialogTitle>
          <DialogDescription>
            Share your thoughts about &quot;{quizTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rating">Your Rating *</Label>
            <div className="flex items-center gap-4">
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating > 0 && (
                <span className="text-sm text-muted-foreground">
                  {rating} out of 5 stars
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Review (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="What did you think about this quiz? Was it challenging? Fun? Educational?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500 characters
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting
                ? "Submitting..."
                : existingReview
                  ? "Update Review"
                  : "Submit Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

