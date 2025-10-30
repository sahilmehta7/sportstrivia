"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Flame, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SuggestionSource = "trending" | "recent";

interface SuggestionItem {
  value: string;
  source: SuggestionSource;
  resultCount?: number | null;
  lastSearchedAt?: string | null;
}

interface SuggestionResponse {
  recent: SuggestionItem[];
  trending: SuggestionItem[];
}

interface PreviewResultItem {
  id: string;
  title: string;
  slug: string;
  sport?: string | null;
  difficulty?: string | null;
  attempts?: number;
}

type DropdownItem =
  | {
      kind: "suggestion";
      id: string;
      label: string;
      value: string;
      source: SuggestionSource;
      meta?: string;
    }
  | {
      kind: "preview";
      id: string;
      label: string;
      href: string;
      meta?: string;
    }
  | {
      kind: "action";
      id: string;
      label: string;
      value: string;
    };

interface GlobalQuizSearchProps {
  className?: string;
  showOnMobile?: boolean;
}

const SOURCE_ICON: Record<SuggestionSource, ReactNode> = {
  trending: <Flame className="h-3.5 w-3.5 text-orange-500" />,
  recent: <Clock className="h-3.5 w-3.5 text-blue-500" />,
};

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toString();
}

function dedupeSuggestions(items: SuggestionItem[]): SuggestionItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.value.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function GlobalQuizSearch({ className, showOnMobile = false }: GlobalQuizSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamValue = searchParams.get("search") ?? "";

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionResponse>({
    recent: [],
    trending: [],
  });
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [previewResults, setPreviewResults] = useState<PreviewResultItem[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionsAbortRef = useRef<AbortController | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);
  const lastSyncedSearchRef = useRef<string>("");

  const listboxId = useId();

  const trimmedSearch = searchTerm.trim();

  useEffect(() => {
    if (!(pathname.startsWith("/quizzes") || pathname.startsWith("/search"))) {
      setSearchTerm("");
      lastSyncedSearchRef.current = "";
    }
  }, [pathname]);

  useEffect(() => {
    if (!(pathname.startsWith("/quizzes") || pathname.startsWith("/search"))) {
      return;
    }

    if (lastSyncedSearchRef.current === searchParamValue) {
      return;
    }

    lastSyncedSearchRef.current = searchParamValue;
    setSearchTerm(searchParamValue);
  }, [pathname, searchParamValue]);

  useEffect(() => {
    let active = true;

    const fetchSuggestions = async () => {
      setIsSuggestionsLoading(true);
      suggestionsAbortRef.current?.abort();
      const controller = new AbortController();
      suggestionsAbortRef.current = controller;

      try {
        const response = await fetch("/api/search/suggestions?context=quiz", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load search suggestions: ${response.status}`);
        }

        const json = await response.json();
        if (!active || controller.signal.aborted) {
          return;
        }

        const recentRaw: SuggestionItem[] = (json?.data?.suggestions?.recent ?? []).map(
          (item: any) => ({
            value: item.query as string,
            source: "recent" as SuggestionSource,
            resultCount: item.resultCount ?? null,
            lastSearchedAt: item.lastSearchedAt ?? null,
          })
        );

        const trendingRaw: SuggestionItem[] = (json?.data?.suggestions?.trending ?? []).map(
          (item: any) => ({
            value: item.query as string,
            source: "trending" as SuggestionSource,
            resultCount: item.resultCount ?? null,
            lastSearchedAt: item.lastSearchedAt ?? null,
          })
        );

        setSuggestions({
          recent: dedupeSuggestions(recentRaw),
          trending: dedupeSuggestions(trendingRaw),
        });
      } catch (error) {
        if (!active) return;
        if ((error as Error).name !== "AbortError") {
          console.warn("[global-search] Unable to fetch suggestions", error);
        }
      } finally {
        if (active) {
          setIsSuggestionsLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      active = false;
      suggestionsAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const query = trimmedSearch;

    if (!query) {
      previewAbortRef.current?.abort();
      setPreviewResults([]);
      setIsPreviewLoading(false);
      return;
    }

    previewAbortRef.current?.abort();
    const controller = new AbortController();
    previewAbortRef.current = controller;

    const timeout = setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const params = new URLSearchParams({ search: query, limit: "3" });
        const response = await fetch(`/api/quizzes?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load preview results: ${response.status}`);
        }

        const json = await response.json();
        if (controller.signal.aborted) {
          return;
        }

        const quizzes: PreviewResultItem[] = (json?.data?.quizzes ?? []).map((quiz: any) => ({
          id: quiz.id as string,
          title: quiz.title as string,
          slug: quiz.slug as string,
          sport: quiz.sport ?? null,
          difficulty: quiz.difficulty ?? null,
          attempts: quiz?._count?.attempts ?? undefined,
        }));

        setPreviewResults(quizzes);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.warn("[global-search] Unable to fetch preview results", error);
        }
        setPreviewResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsPreviewLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [trimmedSearch]);

  const suggestionSections = useMemo(() => {
    const recent = suggestions.recent;
    const trending = suggestions.trending.filter(
      (item) => !recent.some((recentItem) => recentItem.value.toLowerCase() === item.value.toLowerCase())
    );
    return { recent, trending };
  }, [suggestions]);

  const previewItems = useMemo(() =>
    previewResults.map((quiz) => {
      const metaParts: string[] = [];
      if (quiz.sport) metaParts.push(quiz.sport);
      if (quiz.difficulty) metaParts.push(quiz.difficulty.toLowerCase());
      if (typeof quiz.attempts === "number") {
        metaParts.push(`${formatNumber(quiz.attempts)} players`);
      }

      return {
        kind: "preview" as const,
        id: `preview-${quiz.id}`,
        label: quiz.title,
        href: `/quizzes/${quiz.slug}`,
        meta: metaParts.join(" • ") || undefined,
      };
    }),
  [previewResults]);

  const suggestionItems = useMemo(() => {
    const mapSuggestion = (item: SuggestionItem) => ({
      kind: "suggestion" as const,
      id: `suggestion-${item.source}-${item.value.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`,
      label: item.value,
      value: item.value,
      source: item.source,
      meta: typeof item.resultCount === "number" ? `${formatNumber(item.resultCount)} results` : undefined,
    });

    return [
      ...suggestionSections.recent.map(mapSuggestion),
      ...suggestionSections.trending.map(mapSuggestion),
    ];
  }, [suggestionSections]);

  const seeAllItem: DropdownItem | null = useMemo(() => {
    if (!trimmedSearch) {
      return null;
    }

    return {
      kind: "action",
      id: `action-${trimmedSearch.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`,
      label: `See all results for “${trimmedSearch}”`,
      value: trimmedSearch,
    };
  }, [trimmedSearch]);

  const interactiveItems = useMemo(() => {
    const items: DropdownItem[] = [];
    // Only show recent/trending suggestions when there is no active query
    if (!trimmedSearch) {
      items.push(...suggestionItems);
    }
    items.push(...previewItems);
    if (seeAllItem) {
      const exists = items.some(
        (item) => item.kind !== "preview" && item.kind !== "action" && (item as any).value?.toLowerCase?.() === seeAllItem.value.toLowerCase()
      );
      if (!exists) {
        items.push(seeAllItem);
      }
    }
    return items;
  }, [previewItems, seeAllItem, suggestionItems, trimmedSearch]);

  const itemIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    interactiveItems.forEach((item, index) => {
      map.set(item.id, index);
    });
    return map;
  }, [interactiveItems]);

  const activeItemId = activeIndex !== null ? interactiveItems[activeIndex]?.id : undefined;

  const hasDropdownContent = useMemo(
    () =>
      interactiveItems.length > 0 ||
      isPreviewLoading ||
      isSuggestionsLoading,
    [interactiveItems.length, isPreviewLoading, isSuggestionsLoading]
  );

  useEffect(() => {
    if (isFocused && hasDropdownContent) {
      setShowDropdown(true);
    } else if (!isFocused) {
      setShowDropdown(false);
    }
  }, [isFocused, hasDropdownContent]);

  useEffect(() => {
    if (interactiveItems.length === 0) {
      setActiveIndex(null);
      return;
    }

    setActiveIndex((prev) => {
      if (prev === null) return null;
      return Math.min(prev, interactiveItems.length - 1);
    });
  }, [interactiveItems.length]);

  const pushSearch = useCallback(
    (rawValue: string) => {
      const trimmed = rawValue.trim();
      const onSearchPage = pathname.startsWith("/search");
      const params = (pathname.startsWith("/quizzes") || onSearchPage)
        ? new URLSearchParams(searchParams.toString())
        : new URLSearchParams();

      if (trimmed) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }
      params.delete("page");

      const queryString = params.toString();
      const target = queryString ? `/search?${queryString}` : "/search";

      if (onSearchPage) {
        const current = searchParams.get("search") ?? "";
        if (current === trimmed) {
          return;
        }
      }

      lastSyncedSearchRef.current = trimmed;
      router.push(target, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const commitSearch = useCallback(
    (value: string) => {
      pushSearch(value);
      setActiveIndex(null);
      setShowDropdown(false);
    },
    [pushSearch]
  );

  const handleSuggestionSelect = useCallback(
    (value: string) => {
      setSearchTerm(value);
      commitSearch(value);
    },
    [commitSearch]
  );

  const handlePreviewSelect = useCallback(
    (href: string) => {
      setShowDropdown(false);
      setIsFocused(false);
      setActiveIndex(null);
      router.push(href, { scroll: true });
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!hasDropdownContent && event.key !== "Enter") {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!showDropdown) {
          setShowDropdown(true);
        }
        const total = interactiveItems.length;
        if (total === 0) {
          return;
        }

        setActiveIndex((prev) => {
          if (prev === null) {
            return event.key === "ArrowDown" ? 0 : total - 1;
          }
          if (event.key === "ArrowDown") {
            return prev + 1 >= total ? 0 : prev + 1;
          }
          return prev - 1 < 0 ? total - 1 : prev - 1;
        });
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (activeIndex !== null && interactiveItems[activeIndex]) {
          const item = interactiveItems[activeIndex];
          if (item.kind === "suggestion" || item.kind === "action") {
            handleSuggestionSelect(item.value);
          } else if (item.kind === "preview") {
            handlePreviewSelect(item.href);
          }
        } else {
          commitSearch(searchTerm);
        }
        return;
      }

      if (event.key === "Escape") {
        setShowDropdown(false);
        setActiveIndex(null);
        return;
      }
    },
    [activeIndex, commitSearch, handlePreviewSelect, handleSuggestionSelect, hasDropdownContent, interactiveItems, searchTerm, showDropdown]
  );

  const handleBlur = useCallback(() => {
    window.setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      commitSearch(searchTerm);
    }, 120);
  }, [commitSearch, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setIsFocused(false);
        commitSearch(searchTerm);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, searchTerm, commitSearch]);

  return (
    <div
      className={cn(
        "flex flex-col items-stretch gap-2",
        showOnMobile ? "flex" : "hidden lg:flex",
        className
      )}
    >
      <div className="relative" ref={dropdownRef}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search quizzes by name, sport, or topic..."
          className="h-10 rounded-full border-border/70 pl-9 text-sm shadow-none focus-visible:ring-0"
          onFocus={() => {
            setIsFocused(true);
            if (hasDropdownContent) {
              setShowDropdown(true);
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={showDropdown && hasDropdownContent ? listboxId : undefined}
          aria-activedescendant={
            showDropdown && activeItemId ? `${listboxId}-${activeItemId}` : undefined
          }
        />
        {(isSuggestionsLoading || isPreviewLoading) && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {showDropdown && hasDropdownContent && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl">
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Search suggestions"
              className="max-h-80 overflow-y-auto py-2"
            >
              {!trimmedSearch && suggestionSections.recent.length > 0 && (
                <li className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Recent Searches
                </li>
              )}
              {!trimmedSearch && suggestionSections.recent.map((item) => {
                const dropdownItem = suggestionItems.find(
                  (suggestion) => suggestion.value === item.value && suggestion.source === "recent"
                );
                if (!dropdownItem) return null;
                const optionIndex = itemIndexMap.get(dropdownItem.id);
                const isActive = optionIndex !== undefined && optionIndex === activeIndex;
                const optionId = `${listboxId}-${dropdownItem.id}`;

                return (
                  <li key={dropdownItem.id} className="px-1">
                    <button
                      type="button"
                      role="option"
                      id={optionId}
                      aria-selected={isActive}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        isActive ? "bg-muted" : "hover:bg-muted"
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSuggestionSelect(dropdownItem.value)}
                    >
                      <div className="flex items-center gap-2">
                        {SOURCE_ICON.recent}
                        <span className="truncate">{dropdownItem.label}</span>
                      </div>
                      {dropdownItem.meta && (
                        <span className="text-xs text-muted-foreground">{dropdownItem.meta}</span>
                      )}
                    </button>
                  </li>
                );
              })}

              {!trimmedSearch && suggestionSections.trending.length > 0 && (
                <li className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Trending Now
                </li>
              )}
              {!trimmedSearch && suggestionSections.trending.map((item) => {
                const dropdownItem = suggestionItems.find(
                  (suggestion) => suggestion.value === item.value && suggestion.source === "trending"
                );
                if (!dropdownItem) return null;
                const optionIndex = itemIndexMap.get(dropdownItem.id);
                const isActive = optionIndex !== undefined && optionIndex === activeIndex;
                const optionId = `${listboxId}-${dropdownItem.id}`;

                return (
                  <li key={dropdownItem.id} className="px-1">
                    <button
                      type="button"
                      role="option"
                      id={optionId}
                      aria-selected={isActive}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        isActive ? "bg-muted" : "hover:bg-muted"
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSuggestionSelect(dropdownItem.value)}
                    >
                      <div className="flex items-center gap-2">
                        {SOURCE_ICON.trending}
                        <span className="truncate">{dropdownItem.label}</span>
                      </div>
                      {dropdownItem.meta && (
                        <span className="text-xs text-muted-foreground">{dropdownItem.meta}</span>
                      )}
                    </button>
                  </li>
                );
              })}

              {isPreviewLoading && (
                <li className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Searching…
                </li>
              )}

              {previewItems.length > 0 && !isPreviewLoading && (
                <li className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Top Results
                </li>
              )}
              {previewItems.map((item) => {
                const optionIndex = itemIndexMap.get(item.id);
                const isActive = optionIndex !== undefined && optionIndex === activeIndex;
                const optionId = `${listboxId}-${item.id}`;

                return (
                  <li key={item.id} className="px-1">
                    <button
                      type="button"
                      role="option"
                      id={optionId}
                      aria-selected={isActive}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        isActive ? "bg-muted" : "hover:bg-muted"
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handlePreviewSelect(item.href)}
                    >
                      <span className="truncate font-medium">{item.label}</span>
                      {item.meta && (
                        <span className="text-xs text-muted-foreground">{item.meta}</span>
                      )}
                    </button>
                  </li>
                );
              })}

              {seeAllItem && (
                <li className="px-1 pt-3">
                  <button
                    type="button"
                    role="option"
                    id={`${listboxId}-${seeAllItem.id}`}
                    aria-selected={itemIndexMap.get(seeAllItem.id) === activeIndex}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                      itemIndexMap.get(seeAllItem.id) === activeIndex ? "bg-muted" : "hover:bg-muted"
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(seeAllItem.value)}
                  >
                    <span>{seeAllItem.label}</span>
                    <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Enter ↵</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
