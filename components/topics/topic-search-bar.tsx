"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShowcaseSearchBar } from "@/components/showcase/ui/SearchBar";

interface TopicQuizSearchBarProps {
  initialQuery?: string;
  suggestions?: { value: string; label: string; emoji?: string }[];
}

export function TopicQuizSearchBar({
  initialQuery = "",
  suggestions = [],
}: TopicQuizSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const isFirstUpdateRef = useRef(true);

  useEffect(() => {
    setQuery(initialQuery);
    if (!initialQuery) {
      setActiveChip(null);
    }
  }, [initialQuery]);

  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    setQuery(current);
    if (!current) {
      setActiveChip(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = query.trim();

      if (trimmed) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }

      params.delete("page");

      const next = params.toString();
      router.push(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, pathname, router, searchParams]);

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

  return (
    <div className="rounded-3xl border border-border/50 bg-background/60 p-4 shadow-lg backdrop-blur">
      <ShowcaseSearchBar
        value={query}
        placeholder="Search quizzes within this topic..."
        actionLabel="Search"
        chips={chips}
        onValueChange={setQuery}
        onSubmit={(value) => setQuery(value)}
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
  );
}
