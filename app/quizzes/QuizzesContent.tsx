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
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

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

    params.delete("page");

    startTransition(() => {
      router.push(`/quizzes?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());

    startTransition(() => {
      router.push(`/quizzes?${params.toString()}`);
    });
  };

  return (
    <section className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 rounded-full bg-secondary shadow-neon-magenta" />
            <h2 className="text-2xl font-black tracking-tight uppercase">The Library</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Browse every contested arena in the trivia universe.
          </p>
        </div>

        <FilterBar
          groups={filterGroups}
          onChange={handleFilterChange}
          className="border-0 bg-transparent p-0"
        />
      </div>

      {quizzes.length > 0 ? (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const gradient = getSportGradient(quiz.sport, hashString(`${quiz.title}`));
            const durationLabel = quiz.duration ? `${Math.round(quiz.duration / 60)} min` : "Flexible";
            const playersLabel = `${quiz._count?.attempts || 0} players`;

            return (
              <Link key={quiz.id} href={`/quizzes/${quiz.slug}`} className="block h-full">
                <ShowcaseQuizCard
                  title={quiz.title}
                  badgeLabel={quiz.sport || quiz.difficulty || "Quiz"}
                  durationLabel={durationLabel}
                  playersLabel={playersLabel}
                  accent={gradient}
                  coverImageUrl={quiz.descriptionImageUrl}
                  className="w-full"
                />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[3rem] border border-dashed border-white/10 glass bg-white/5 p-12 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative h-20 w-20 rounded-full glass border border-white/10 flex items-center justify-center text-4xl">
              🔎
            </div>
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase mb-2">No Arenas Found</h2>
          <p className="max-w-md text-muted-foreground font-medium">
            Try adjusting your filters or check back soon for new challenges.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pt-12">
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
