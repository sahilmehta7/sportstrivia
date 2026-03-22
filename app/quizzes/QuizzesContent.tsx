"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { QuizPagination } from "@/components/quizzes/quiz-pagination";
import { FilterBar } from "@/components/quizzes/filter-bar";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { getSportGradient } from "@/lib/quiz-formatters";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import { Search } from "lucide-react";
import { buildQuizzesPath } from "@/app/quizzes/client-query-utils";
import type { ContinuePlayingRailItem } from "@/app/quizzes/quiz-utils";

interface QuizzesContentProps {
  quizzes: PublicQuizListItem[];
  filterGroups: ShowcaseFilterGroup[];
  difficultyOptions: string[];
  continuePlayingItems?: ContinuePlayingRailItem[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function QuizzesContent({
  quizzes,
  filterGroups,
  difficultyOptions,
  continuePlayingItems = [],
  pagination,
}: QuizzesContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const contentRef = useRef<HTMLDivElement>(null);
  const hasHydratedTopicFromStorage = useRef(false);
  const topicParam = searchParams.get("topic");
  const sportParam = searchParams.get("sport");
  const difficultyParam = searchParams.get("difficulty");
  const sortByParam = searchParams.get("sortBy");
  const sortOrderParam = searchParams.get("sortOrder");
  const categoryGroup = filterGroups.find((group) => group.id === "category");
  const categoryOptions = categoryGroup?.options ?? [];

  const pushWithQuery = (
    input: Parameters<typeof buildQuizzesPath>[1]
  ) => {
    const nextPath = buildQuizzesPath(
      new URLSearchParams(searchParams.toString()),
      input
    );
    startTransition(() => {
      router.push(nextPath, { scroll: false });
    });
  };

  // Scroll to top of the library section when filters/page changes
  // but only if we're not at the top already, to avoid jarring jumps
  useEffect(() => {
    if (!isPending && contentRef.current) {
      // Optional: scroll into view if needed
    }
  }, [isPending]);

  useEffect(() => {
    if (hasHydratedTopicFromStorage.current) return;
    hasHydratedTopicFromStorage.current = true;

    if (topicParam || sportParam) return;

    const storedTopic = window.localStorage.getItem("quizzes:lastTopicSlug");
    if (!storedTopic) return;

    const topicExists = categoryOptions.some(
      (option) => option.value !== "all" && option.value === storedTopic
    );
    if (!topicExists) {
      window.localStorage.removeItem("quizzes:lastTopicSlug");
      return;
    }

    pushWithQuery({
      set: { topic: storedTopic },
      remove: ["sport"],
    });
  }, [categoryOptions, topicParam, sportParam]);

  const setPersistedTopic = (topicSlug?: string) => {
    if (topicSlug) {
      window.localStorage.setItem("quizzes:lastTopicSlug", topicSlug);
      return;
    }
    window.localStorage.removeItem("quizzes:lastTopicSlug");
  };

  const handleTopicSelection = (topicSlug: string) => {
    if (topicSlug === "all") {
      setPersistedTopic();
      pushWithQuery({
        remove: ["topic", "sport"],
      });
      return;
    }

    setPersistedTopic(topicSlug);
    pushWithQuery({
      set: { topic: topicSlug },
      remove: ["sport"],
    });
  };

  const handleFilterChange = (groupId: string, option: any) => {
    if (groupId === "category") {
      handleTopicSelection(option.value);
      return;
    }
  };

  const handleDifficultyChange = (difficulty: string) => {
    if (difficulty === "all") {
      pushWithQuery({
        remove: ["difficulty"],
      });
      return;
    }
    pushWithQuery({
      set: { difficulty },
    });
  };

  const handleSortChange = (sortPreset: string) => {
    if (sortPreset === "popularity") {
      pushWithQuery({
        set: {
          sortBy: "popularity",
          sortOrder: "desc",
        },
      });
      return;
    }
    if (sortPreset === "rating") {
      pushWithQuery({
        set: {
          sortBy: "rating",
          sortOrder: "desc",
        },
      });
      return;
    }

    pushWithQuery({
      set: {
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });
  };

  const handlePageChange = (page: number) => {
    pushWithQuery({
      set: { page: page.toString() },
      resetPage: false,
    });
  };

  const activeTopicLabel = categoryOptions.find((option) => option.value === topicParam)?.label;
  const selectedSortValue =
    sortByParam === "popularity"
      ? "popularity"
      : sortByParam === "rating"
        ? "rating"
        : sortByParam === "createdAt" && sortOrderParam === "desc"
          ? "createdAt"
          : "createdAt";

  return (
    <section ref={contentRef} className="space-y-16 relative">
      {/* Subtle Loading Indicator */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-foreground/5">
          <div className="h-full bg-primary animate-progress shadow-neon-cyan" style={{ width: '40%' }} />
        </div>
      )}

      <div className={cn("flex flex-col gap-12 transition-opacity duration-300", isPending && "opacity-60")}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-foreground/5 pb-8">
          <div className="space-y-4">
            <h2 className={cn(
              "text-5xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]",
              getGradientText("editorial")
            )}>
              THE LIBRARY
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground font-semibold uppercase tracking-tight leading-tight">
              Browse every contested quiz in the trivia universe.
            </p>
          </div>
        </div>

        <FilterBar
          groups={filterGroups}
          onChange={handleFilterChange}
          isPending={isPending}
          className="border-0 bg-transparent p-0"
        />

        <div className="space-y-4 border-y border-foreground/10 bg-background px-3 py-4 sm:px-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Difficulty
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["all", ...difficultyOptions].map((difficulty) => {
                  const active = (difficultyParam ?? "all") === difficulty;
                  return (
                    <button
                      key={difficulty}
                      type="button"
                      aria-label={difficulty}
                      aria-pressed={active}
                      disabled={isPending}
                      onClick={() => handleDifficultyChange(difficulty)}
                      className={cn(
                        "h-7 border px-2.5 text-[9px] font-black uppercase tracking-[0.18em] transition-colors",
                        "disabled:cursor-wait disabled:opacity-60",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground/15 bg-background text-foreground/75 hover:border-foreground/40 hover:text-foreground"
                      )}
                    >
                      {difficulty}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Sort
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: "createdAt", label: "Newest" },
                  { value: "popularity", label: "Most Played" },
                  { value: "rating", label: "Top Rated" },
                ].map((preset) => {
                  const active = selectedSortValue === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      aria-label={preset.label}
                      aria-pressed={active}
                      disabled={isPending}
                      onClick={() => handleSortChange(preset.value)}
                      className={cn(
                        "h-7 border px-2.5 text-[9px] font-black uppercase tracking-[0.16em] transition-colors",
                        "disabled:cursor-wait disabled:opacity-60",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground/15 bg-background text-foreground/75 hover:border-foreground/40 hover:text-foreground"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {activeTopicLabel ? (
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <span>Showing: {activeTopicLabel}</span>
              <button
                type="button"
                className="border border-foreground/15 px-2 py-1 text-[9px] text-foreground hover:border-foreground/40"
                onClick={() => handleTopicSelection("all")}
                disabled={isPending}
              >
                Reset
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {continuePlayingItems.length > 0 ? (
        <div className="relative overflow-hidden border border-foreground/15 bg-background">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-foreground/40 to-transparent" />
          <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3 sm:px-5">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-foreground">
                Continue Playing
              </h3>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Pick up your active recurring runs
              </p>
            </div>
            <span className="border border-foreground/20 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-foreground/80">
              {continuePlayingItems.length} Active
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 py-4 no-scrollbar sm:px-5">
            {continuePlayingItems.map((item) => (
              <Link
                key={item.id}
                href={`/quizzes/${item.slug}`}
                className="group relative w-[240px] shrink-0 border border-foreground/15 bg-muted/10 p-3 transition-colors hover:border-foreground/35"
                aria-label={`Resume ${item.title}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Recurring
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/80">
                    {item.lastPlayedLabel}
                  </span>
                </div>
                <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-foreground">
                  {item.title}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground">
                    {item.streak > 0 ? `Streak ${item.streak}d` : "No Streak"}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-accent group-hover:text-foreground">
                    Resume →
                  </span>
                </div>
                {item.daysOfWeek && item.daysOfWeek.length === 7 ? (
                  <div className="mt-3 flex items-center gap-1">
                    {item.daysOfWeek.map((completed, index) => (
                      <span
                        key={`${item.id}-day-${index}`}
                        className={cn(
                          "h-1.5 w-full",
                          completed ? "bg-foreground/80" : "bg-foreground/10"
                        )}
                      />
                    ))}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {quizzes.length > 0 ? (
        <div className={cn(
          "grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-500",
          isPending ? "opacity-40 grayscale-[0.5] scale-[0.99] pointer-events-none" : "opacity-100"
        )}>
          {quizzes.map((quiz) => {
            const gradient = getSportGradient(quiz.sport, hashString(`${quiz.title}`));
            const durationLabel = quiz.duration ? `${Math.round(quiz.duration / 60)} MIN` : "FLEX";
            const playersLabel = `${(quiz._count?.attempts || 0).toLocaleString()} PLAYERS`;
            const difficultyLabel = (quiz.difficulty || "MEDIUM").toString();

            return (
              <ShowcaseQuizCard
                key={quiz.id}
                id={quiz.id}
                title={quiz.title}
                badgeLabel={quiz.sport || quiz.difficulty || "Quiz"}
                durationLabel={durationLabel}
                playersLabel={playersLabel}
                difficultyLabel={difficultyLabel}
                accent={gradient}
                coverImageUrl={quiz.descriptionImageUrl}
                href={`/quizzes/${quiz.slug}`}
                className="w-full"
              />
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[500px] flex-col items-center justify-center border-2 border-dashed border-foreground/10 bg-muted/5 p-16 text-center">
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
            <div className="relative h-24 w-24 border-2 border-foreground bg-background flex items-center justify-center shadow-athletic">
              <Search className="h-10 w-10 text-foreground" />
            </div>
          </div>
          <div className="space-y-4 max-w-sm">
            <h2 className="text-3xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]">No Quizzes Found</h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 leading-relaxed">
              Target parameters returned null. Adjust filters or check back for new deployments.
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pt-16 border-t-2 border-foreground/5">
          <QuizPagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            pageSize={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
}
