"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type StartCollectionButtonProps = {
  collectionId: string;
  collectionSlug: string;
  initialNextQuizSlug?: string | null;
  isAuthenticated: boolean;
};

export function StartCollectionButton({
  collectionId,
  collectionSlug,
  initialNextQuizSlug,
  isAuthenticated,
}: StartCollectionButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [nextQuizSlug, setNextQuizSlug] = useState(initialNextQuizSlug ?? null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onStart = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=/collections/${collectionSlug}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/start-or-resume`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to start collection");
      }

      const slug = payload.data?.nextQuiz?.slug ?? null;
      setNextQuizSlug(slug);

      if (slug) {
        startTransition(() => {
          router.push(`/quizzes/${slug}`);
        });
      } else {
        toast({
          title: "Collection complete",
          description: "You have completed every quiz in this collection.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Unable to start collection",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={onStart}
      disabled={isSubmitting || isPending}
      className="min-h-11 rounded-xl"
    >
      {isSubmitting || isPending
        ? "Opening..."
        : nextQuizSlug
        ? "Resume Collection"
        : "Start Collection"}
    </Button>
  );
}
