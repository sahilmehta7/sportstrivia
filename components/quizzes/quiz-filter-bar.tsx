"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Filter, RefreshCw } from "lucide-react";
import type { Difficulty } from "@prisma/client";
import type { QuizFilterOptions } from "@/lib/services/public-quiz.service";

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

const ratingOptions = [
  { label: "All ratings", value: "all" },
  { label: "4★ and up", value: "4" },
  { label: "3★ and up", value: "3" },
  { label: "2★ and up", value: "2" },
];

interface QuizFilterBarProps extends QuizFilterOptions {
  filters: {
    search?: string;
    sport?: string;
    difficulty?: Difficulty;
    tag?: string;
    topic?: string;
    sortBy?: "popularity" | "rating" | "createdAt";
    sortOrder?: "asc" | "desc";
    isFeatured?: boolean;
    comingSoon?: boolean;
    minRating?: number;
  };
  total: number;
}

export function QuizFilterBar({
  filters,
  sports,
  difficulties,
  tags,
  topics,
  total,
}: QuizFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(filters.search ?? "");
  const initialRenderRef = useRef(true);

  useEffect(() => {
    setSearchTerm(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      updateQuery("search", searchTerm || undefined);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const updateQuery = (key: string, value?: string) => {
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

  const updateBoolean = (key: string, value: boolean) => {
    updateQuery(key, value ? "true" : undefined);
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

  const handleRatingChange = (value: string) => {
    updateQuery("minRating", value === "all" ? undefined : value);
  };

  const resetFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const activeFilters = useMemo(() => {
    const badges: string[] = [];

    if (filters.sport) badges.push(`Sport: ${filters.sport}`);
    if (filters.difficulty)
      badges.push(`Difficulty: ${difficultyLabels[filters.difficulty]}`);
    if (filters.tag) badges.push(`Tag: ${filters.tag}`);
    if (filters.topic) badges.push(`Topic: ${filters.topic}`);
    if (filters.isFeatured) badges.push("Featured");
    if (filters.comingSoon) badges.push("Coming soon");
    if (filters.minRating)
      badges.push(`Rating ≥ ${filters.minRating.toFixed(1)}★`);

    return badges;
  }, [filters]);

  const sortValue = useMemo(() => {
    const current = sortOptions.find(
      (option) =>
        option.value === `${filters.sortBy ?? "createdAt"}:${filters.sortOrder ?? "desc"}`
    );
    return current?.value ?? "createdAt:desc";
  }, [filters.sortBy, filters.sortOrder]);

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>{total.toLocaleString()} quizzes available</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((label) => (
            <Badge key={label} variant="secondary" className="bg-primary/10 text-primary">
              {label}
            </Badge>
          ))}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-2 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset filters
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="lg:col-span-2 xl:col-span-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            Search quizzes
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, sport, or description"
            />
          </label>
        </div>
        <div>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            Sport
            <Select
              value={filters.sport ?? "all"}
              onValueChange={(value) => updateQuery("sport", value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sports</SelectItem>
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            Difficulty
            <Select
              value={filters.difficulty ?? "all"}
              onValueChange={(value) => updateQuery("difficulty", value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficultyLabels[difficulty]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            Tag
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
          </label>
        </div>
        <div>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            Topic
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
          </label>
        </div>
        <div>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            Sort by
            <Select value={sortValue} onValueChange={handleSortChange}>
              <SelectTrigger>
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
          </label>
        </div>
        <div>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            Minimum rating
            <Select
              value={filters.minRating ? filters.minRating.toString() : "all"}
              onValueChange={handleRatingChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Featured only</span>
            <Switch
              checked={Boolean(filters.isFeatured)}
              onCheckedChange={(checked) => updateBoolean("featured", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Coming soon</span>
            <Switch
              checked={Boolean(filters.comingSoon)}
              onCheckedChange={(checked) => updateBoolean("comingSoon", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
