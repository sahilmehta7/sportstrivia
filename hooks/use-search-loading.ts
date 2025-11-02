import { useState, useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface UseSearchLoadingOptions {
  debounceMs?: number;
}

interface UseSearchLoadingReturn {
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

/**
 * Hook to track loading state for search operations
 * Since search uses URL navigation (router.push), we track loading during debounce and navigation
 */
export function useSearchLoading(
  searchQuery: string,
  options: UseSearchLoadingOptions = {}
): UseSearchLoadingReturn {
  const { debounceMs = 400 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track when a query change is initiated
  const handleQueryChange = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      const currentSearch = searchParams.get("search") ?? "";

      // If query changed, mark as pending
      if (trimmed !== currentSearch) {
        setPendingQuery(trimmed);
        setIsLoading(true);
        setError(null);
      }
    },
    [searchParams]
  );

  // Effect to trigger loading when query changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      handleQueryChange(searchQuery);
    }
  }, [searchQuery, handleQueryChange]);

  // Effect to clear loading when URL matches pending query
  useEffect(() => {
    if (pendingQuery !== null) {
      const currentSearch = searchParams.get("search") ?? "";
      if (currentSearch === pendingQuery || (!currentSearch && !pendingQuery)) {
        // Navigation completed
        setIsLoading(false);
        setPendingQuery(null);
      }
    }
  }, [searchParams, pendingQuery]);

  // Timeout fallback - clear loading after debounce + navigation timeout
  useEffect(() => {
    if (pendingQuery !== null) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
        setPendingQuery(null);
      }, debounceMs + 1000); // debounce + 1s for navigation

      return () => clearTimeout(timeout);
    }
  }, [pendingQuery, debounceMs]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    clearError,
  };
}

