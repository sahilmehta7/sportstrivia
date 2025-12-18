"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { startTransition } from "react";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { glassText } from "@/components/showcase/ui/typography";
import { QuizPagination } from "@/components/quizzes/quiz-pagination";
import { FilterBar } from "@/components/quizzes/filter-bar";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { getSportGradient } from "@/lib/quiz-formatters";

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

    params.delete("page"); // Reset to page 1 when filters change

    // Use startTransition for optimistic UI updates
    startTransition(() => {
      router.push(`/quizzes?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());

    // Use startTransition for optimistic UI updates
    startTransition(() => {
      router.push(`/quizzes?${params.toString()}`);
    });
  };

  return (
    <>
      {/* All Quizzes Section */}
      <section className="mt-4 md:mt-8">
        <div className="mb-6">
          <h2 className={glassText.h2}>All Quizzes</h2>
          <p className={"mt-1 " + glassText.subtitle}>
            Discover and play quizzes from all categories
          </p>
        </div>

        {/* Filter Bar - Integrated styling */}
        <div className="mb-6">
          <FilterBar
            groups={filterGroups}
            onChange={handleFilterChange}
            className="border-0 bg-transparent p-0"
          />
        </div>

        {quizzes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {quizzes.map((quiz) => {
              const gradient = getSportGradient(quiz.sport, hashString(`${quiz.title}`));
              const durationLabel = quiz.duration ? `${Math.round(quiz.duration / 60)} min` : "Flexible";
              const playersLabel = `${quiz._count?.attempts || 0} players`;

              return (
                <Link key={quiz.id} href={`/quizzes/${quiz.slug}`} className="block">
                  <ShowcaseQuizCard
                    title={quiz.title}
                    badgeLabel={quiz.sport || quiz.difficulty || "Quiz"}
                    durationLabel={durationLabel}
                    playersLabel={playersLabel}
                    accent={gradient}
                    coverImageUrl={quiz.descriptionImageUrl}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 p-12 text-center text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">No quizzes match your filters</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Try adjusting your filters or check back soon as new trivia challenges are added regularly.
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-8">
          <QuizPagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            pageSize={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      </section>
    </>
  );
}
