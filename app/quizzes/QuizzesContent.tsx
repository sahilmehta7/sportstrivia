"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { QuizPagination } from "@/components/quizzes/quiz-pagination";
import { ShowcaseFilterBar } from "@/components/showcase/ui/FilterBar";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";

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
    
    // Use startTransition to prevent blocking the UI
    router.push(`/quizzes?${params.toString()}`);
  };

  return (
    <>
      {/* Showcase Filter Bar */}
      <ShowcaseFilterBar 
        groups={filterGroups} 
        onChange={handleFilterChange}
        className="mb-6"
      />

      {/* Quiz Grid */}
      <section className="mt-8">
        {quizzes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quizzes.map((quiz) => (
              <Link key={quiz.id} href={`/quizzes/${quiz.slug}`}>
                <ShowcaseQuizCard
                  title={quiz.title}
                  durationLabel={formatQuizDuration(quiz.duration ?? quiz.timePerQuestion)}
                  playersLabel={`${formatPlayerCount(quiz._count.attempts)} players`}
                  accent={getSportGradient(quiz.sport)}
                  coverImageUrl={quiz.descriptionImageUrl}
                  className="w-full"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 p-12 text-center text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">No quizzes match your filters</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Try adjusting your filters or check back soon as new trivia challenges are added regularly.
            </p>
          </div>
        )}
      </section>

      <QuizPagination
        page={pagination.page}
        pages={pagination.pages}
        total={pagination.total}
        pageSize={pagination.limit}
      />
    </>
  );
}
