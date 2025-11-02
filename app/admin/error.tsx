"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/ErrorState";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Admin panel error"
      message={
        error.message ||
        "An error occurred in the admin panel. Please check your permissions and try again."
      }
      onRetry={reset}
      backHref="/admin"
      backLabel="Back to admin"
    />
  );
}

