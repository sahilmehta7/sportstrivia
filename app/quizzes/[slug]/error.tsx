"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/ErrorState";

export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Quiz error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Failed to load quiz"
      message={
        error.message ||
        "We couldn't load this quiz. It may have been removed or is temporarily unavailable."
      }
      onRetry={reset}
      backHref="/quizzes"
      backLabel="Back to quizzes"
    />
  );
}

