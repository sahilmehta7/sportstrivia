"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/ErrorState";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Failed to load profile"
      message={
        error.message ||
        "We couldn't load this profile. The user may not exist or the page is temporarily unavailable."
      }
      onRetry={reset}
    />
  );
}

