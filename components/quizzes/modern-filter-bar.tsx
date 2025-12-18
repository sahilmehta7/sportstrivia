"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  RefreshCw,
  ChevronDown,
  Star
} from "lucide-react";
import type { Difficulty } from "@prisma/client";
import type { QuizFilterOptions } from "@/lib/services/public-quiz.service";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const difficultyLabels: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

const sortOptions = [
  { label: "Newest", value: "createdAt:desc" },
  { label: "Oldest", value: "createdAt:asc" },
  { label: "Top Rated", value: "rating:desc" },
  { label: "Most Popular", value: "popularity:desc" },
];

interface ModernFilterBarProps extends QuizFilterOptions {
  filters: {
    sport?: string;
    difficulty?: Difficulty;
    tag?: string;
    topic?: string;
    sortBy?: "popularity" | "rating" | "createdAt";
    sortOrder?: "asc" | "desc";
    minRating?: number;
  };
  total: number;
}

export function ModernFilterBar({
  filters,
  sports,
  difficulties,
  tags,
  topics,
  total,
}: ModernFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);

  const updateQuery = (key: string, value?: string) => {
    trackEvent("filter_change", { filter_type: key, value });
    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(":");
    const params = new URLSearchParams(searchParams.toString());

    if (!sortBy || !sortOrder) {
      params.delete("sortBy");
      params.delete("sortOrder");
    } else {
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
    }

    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const handleRatingClick = (rating: number) => {
    trackEvent("filter_change", { filter_type: "minRating", value: rating });
    if (filters.minRating === rating) {
      updateQuery("minRating", undefined);
    } else {
      updateQuery("minRating", rating.toString());
    }
  };

  const resetFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sport) count++;
    if (filters.difficulty) count++;
    if (filters.tag) count++;
    if (filters.topic) count++;
    if (filters.minRating) count++;
    return count;
  }, [filters]);

  const sortValue = useMemo(() => {
    const current = sortOptions.find(
      (option) =>
        option.value === `${filters.sortBy ?? "createdAt"}:${filters.sortOrder ?? "desc"}`
    );
    return current?.value ?? "createdAt:desc";
  }, [filters.sortBy, filters.sortOrder]);

  return (
    <div className="space-y-4">
      {/* Compact Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{total.toLocaleString()}</span>
          <span>quizzes</span>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Select value={sortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="h-9 w-[140px] border-none bg-transparent shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Active Filters Count */}
          {activeFilterCount > 0 && (
            <>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </>
          )}

          {/* Expand/Collapse Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-9 gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 rounded-xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
          {/* Sport Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Sport</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!filters.sport ? "default" : "outline"}
                size="sm"
                onClick={() => updateQuery("sport", undefined)}
                className="h-9"
              >
                All Sports
              </Button>
              {sports.map((sport) => (
                <Button
                  key={sport}
                  variant={filters.sport === sport ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateQuery("sport", sport)}
                  className="h-9"
                >
                  {sport}
                </Button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Difficulty</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!filters.difficulty ? "default" : "outline"}
                size="sm"
                onClick={() => updateQuery("difficulty", undefined)}
                className="h-9"
              >
                All difficulties
              </Button>
              {difficulties.map((difficulty) => (
                <Button
                  key={difficulty}
                  variant={filters.difficulty === difficulty ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateQuery("difficulty", difficulty)}
                  className="h-9"
                >
                  {difficultyLabels[difficulty]}
                </Button>
              ))}
            </div>
          </div>

          {/* Rating Filter - Amazon Style */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Rating</label>
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingClick(rating)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-left transition-all hover:border-primary/50 hover:bg-primary/5",
                    filters.minRating === rating
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-transparent"
                  )}
                >
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          "h-4 w-4",
                          index < rating
                            ? "fill-primary text-primary"
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">& up</span>
                  {filters.minRating === rating && (
                    <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary">
                      Active
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Filter */}
          {topics.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Topic</label>
              <Select
                value={filters.topic ?? "all"}
                onValueChange={(value) => updateQuery("topic", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any topic</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.slug} value={topic.slug}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tag</label>
              <Select
                value={filters.tag ?? "all"}
                onValueChange={(value) => updateQuery("tag", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any tag</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.slug} value={tag.slug}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
