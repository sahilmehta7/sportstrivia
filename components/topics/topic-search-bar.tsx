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

  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const { isLoading, error: loadingError, clearError } = useSearchLoading(debouncedQuery, { debounceMs });

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const urlQuery = searchParams.get("search") ?? "";
      if (urlQuery) setQuery(urlQuery);
      else if (initialQuery) setQuery(initialQuery);
      return;
    }
    const urlQuery = searchParams.get("search") ?? "";
    if (urlQuery !== query) setQuery(urlQuery);
  }, [initialQuery, searchParams, query]);

  useEffect(() => {
    const urlQuery = searchParams.get("search") ?? "";
    if (urlQuery !== query && urlQuery !== debouncedQuery) {
      setQuery(urlQuery);
      lastExecutedQueryRef.current = urlQuery || null;
    }
    if (!urlQuery) setActiveChip(null);
  }, [searchParams, query, debouncedQuery]);

  useEffect(() => {
    if (isInitialMountRef.current) return;
    const trimmed = debouncedQuery.trim();
    if (trimmed.length > 0 && trimmed.length < minQueryLength) return;
    const normalizedQuery = trimmed || null;
    if (normalizedQuery === lastExecutedQueryRef.current) return;

    const executeSearch = async () => {
      try {
        setError(null);
        const params = new URLSearchParams(searchParams.toString());
        if (normalizedQuery) params.set("search", normalizedQuery);
        else params.delete("search");
        params.delete("page");
        const next = params.toString();
        await router.push(next ? `${pathname}?${next}` : pathname, { scroll: false });
        lastExecutedQueryRef.current = normalizedQuery;
      } catch (err) {
        setError("Failed to update search.");
      }
    };
    executeSearch();
  }, [debouncedQuery, pathname, router, searchParams, minQueryLength]);

  useEffect(() => {
    if (!query) { setActiveChip(null); return; }
    const matchingSuggestion = suggestions.find((chip) => chip.value === query);
    setActiveChip(matchingSuggestion ? matchingSuggestion.value : null);
  }, [query, suggestions]);

  const chips = useMemo(
    () => suggestions.map((chip) => ({ ...chip, active: chip.value === activeChip })),
    [suggestions, activeChip]
  );
  const displayError = error || (loadingError ? loadingError.message : null);

  return (
    <SearchErrorBoundary>
      <div className="space-y-6">
        {displayError && <ErrorMessage title="Search Error" message={displayError} />}

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-[2rem]" />
          <div className="relative rounded-[2rem] border border-white/5 bg-background/40 p-2 shadow-glass backdrop-blur-xl group-focus-within:border-primary/20 transition-all">
            <ShowcaseSearchBar
              value={query}
              placeholder="SCAN QUIZZES WITHIN THIS SECTOR..."
              actionLabel="INITIALIZE SCAN"
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
      </div>
    </SearchErrorBoundary>
  );
}
