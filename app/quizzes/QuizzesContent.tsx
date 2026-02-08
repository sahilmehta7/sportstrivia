"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTransition, useRef, useEffect } from "react";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { QuizPagination } from "@/components/quizzes/quiz-pagination";
import { FilterBar } from "@/components/quizzes/filter-bar";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { getSportGradient } from "@/lib/quiz-formatters";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import { Search } from "lucide-react";

interface QuizzesContentProps {
  quizzes: PublicQuizListItem[];
  filterGroups: ShowcaseFilterGroup[];
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

export function QuizzesContent({ quizzes, filterGroups, pagination }: QuizzesContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top of the library section when filters/page changes
  // but only if we're not at the top already, to avoid jarring jumps
  useEffect(() => {
    if (!isPending && contentRef.current) {
      // Optional: scroll into view if needed
    }
  }, [isPending]);

  const handleFilterChange = (groupId: string, option: any) => {
    const params = new URLSearchParams(searchParams.toString());

    if (groupId === "category") {
      if (option.value === "all") {
        params.delete("topic");
        params.delete("sport");
      } else {
        params.set("topic", option.value);
      }
    }

    params.delete("page");

    startTransition(() => {
      router.push(`/quizzes?${params.toString()}`, { scroll: false });
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());

    startTransition(() => {
      router.push(`/quizzes?${params.toString()}`, { scroll: false });
    });
  };

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
              Browse every contested arena in the trivia universe.
            </p>
          </div>
        </div>

        <FilterBar
          groups={filterGroups}
          onChange={handleFilterChange}
          isPending={isPending}
          className="border-0 bg-transparent p-0"
        />
      </div>

      {quizzes.length > 0 ? (
        <div className={cn(
          "grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-500",
          isPending ? "opacity-40 grayscale-[0.5] scale-[0.99] pointer-events-none" : "opacity-100"
        )}>
          {quizzes.map((quiz) => {
            const gradient = getSportGradient(quiz.sport, hashString(`${quiz.title}`));
            const durationLabel = quiz.duration ? `${Math.round(quiz.duration / 60)} MIN` : "FLEX";
            const playersLabel = `${(quiz._count?.attempts || 0).toLocaleString()} PLAYERS`;

            return (
              <ShowcaseQuizCard
                key={quiz.id}
                id={quiz.id}
                title={quiz.title}
                badgeLabel={quiz.sport || quiz.difficulty || "Quiz"}
                durationLabel={durationLabel}
                playersLabel={playersLabel}
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
            <h2 className="text-3xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]">No Arenas Found</h2>
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
