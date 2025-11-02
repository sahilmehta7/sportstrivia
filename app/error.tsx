"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/ErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Root error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong!"
      message={error.message || "An unexpected error occurred. Please try again."}
      onRetry={reset}
    />
  );
}

