"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StarRating } from "@/components/ui/star-rating";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
  currentUserId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isOwnReview = currentUserId === review.user.id;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(review.createdAt));

  const shouldTruncate = review.comment && review.comment.length > 200;
  const displayComment = expanded || !shouldTruncate
    ? review.comment
    : review.comment?.substring(0, 200) + "...";

  const handleDelete = () => {
    setShowDeleteDialog(false);
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Link href={`/profile/${review.user.id}`}>
              <UserAvatar
                src={review.user.image}
                alt={review.user.name || "User"}
                size="md"
                className="mt-1"
              />
            </Link>

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/profile/${review.user.id}`}
                    className="font-semibold hover:underline"
                  >
                    {review.user.name || "Anonymous"}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating value={review.rating} readonly size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {formattedDate}
                    </span>
                  </div>
                </div>

                {isOwnReview && (onEdit || onDelete) && (
                  <div className="flex gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {review.comment && (
                <div className="text-sm text-muted-foreground">
                  <p className="whitespace-pre-wrap">{displayComment}</p>
                  {shouldTruncate && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setExpanded(!expanded)}
                      className="h-auto p-0 text-xs"
                    >
                      {expanded ? "Show less" : "Read more"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

