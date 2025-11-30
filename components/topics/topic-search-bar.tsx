"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShowcaseSearchBar } from "@/components/showcase/ui/SearchBar";
import { useSearchLoading } from "@/hooks/use-search-loading";
import { SearchErrorBoundary } from "@/components/search/SearchErrorBoundary";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface TopicQuizSearchBarProps {
  initialQuery?: string;
  suggestions?: { value: string; label: string; emoji?: string }[];
  debounceMs?: number;
  minQueryLength?: number;
}

const DEFAULT_DEBOUNCE_MS = 400;
const DEFAULT_MIN_QUERY_LENGTH = 2;

export function TopicQuizSearchBar({
  initialQuery = "",
  suggestions = [],
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
}: TopicQuizSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastExecutedQueryRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  // Debounce the query value
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  
  // Track loading state for search operations
  const { isLoading, error: loadingError, clearError } = useSearchLoading(debouncedQuery, { debounceMs });

  // Sync with initial query prop
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const urlQuery = searchParams.get("search") ?? "";
      if (urlQuery) {
        setQuery(urlQuery);
      } else if (initialQuery) {
    setQuery(initialQuery);
      }
      return;
    }

    // Update query from URL if it changed externally
    const urlQuery = searchParams.get("search") ?? "";
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [initialQuery, searchParams, query]);

  // Sync with URL params changes (external navigation)
  useEffect(() => {
    const urlQuery = searchParams.get("search") ?? "";
    if (urlQuery !== query && urlQuery !== debouncedQuery) {
      setQuery(urlQuery);
      lastExecutedQueryRef.current = urlQuery || null;
    }
    if (!urlQuery) {
      setActiveChip(null);
    }
  }, [searchParams, query, debouncedQuery]);

  // Execute search when debounced query changes
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      return;
    }

    const trimmed = debouncedQuery.trim();
    
    // Check minimum length - if query is too short, clear search
    if (trimmed.length > 0 && trimmed.length < minQueryLength) {
      // Query too short, don't search yet
      return;
    }

    // Prevent duplicate searches
    const normalizedQuery = trimmed || null;
    if (normalizedQuery === lastExecutedQueryRef.current) {
      return;
    }

    // Execute search
    const executeSearch = async () => {
      try {
        setError(null);
      const params = new URLSearchParams(searchParams.toString());

        if (normalizedQuery) {
          params.set("search", normalizedQuery);
      } else {
        params.delete("search");
      }

      params.delete("page");

      const next = params.toString();
        await router.push(next ? `${pathname}?${next}` : pathname, { scroll: false });
        
        // Update last executed query
        lastExecutedQueryRef.current = normalizedQuery;
      } catch (err) {
        console.error("Search navigation error:", err);
        setError(err instanceof Error ? err.message : "Failed to update search. Please try again.");
      }
    };

    executeSearch();
  }, [debouncedQuery, pathname, router, searchParams, minQueryLength]);

  useEffect(() => {
    if (!query) {
      setActiveChip(null);
      return;
    }

    const matchingSuggestion = suggestions.find((chip) => chip.value === query);
    setActiveChip(matchingSuggestion ? matchingSuggestion.value : null);
  }, [query, suggestions]);

  const chips = useMemo(
    () =>
      suggestions.map((chip) => ({
        ...chip,
        active: chip.value === activeChip,
      })),
    [suggestions, activeChip]
  );

  const displayError = error || (loadingError ? loadingError.message : null);

  return (
    <SearchErrorBoundary>
      <div className="space-y-4">
        {displayError && (
          <ErrorMessage
            title="Search Error"
            message={displayError}
          />
        )}
    <div className="rounded-3xl border border-border/50 bg-background/60 p-4 shadow-lg backdrop-blur">
      <ShowcaseSearchBar
        value={query}
        placeholder="Search quizzes within this topic..."
        actionLabel="Search"
        chips={chips}
            loading={isLoading}
            onValueChange={(value) => {
              setQuery(value);
              setError(null);
              if (loadingError) clearError();
            }}
        onSubmit={(value) => setQuery(value)}
            onClear={() => {
              setQuery("");
              setError(null);
              if (loadingError) clearError();
            }}
        onChipToggle={(chip, active) => {
          if (active) {
            setActiveChip(chip.value);
            setQuery(chip.value);
          } else {
            setActiveChip(null);
            setQuery("");
          }
        }}
      />
    </div>
      </div>
    </SearchErrorBoundary>
  );
}
