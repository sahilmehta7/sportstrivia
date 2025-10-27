"use client";

import { ShowcaseMasonryGrid } from "@/components/showcase/ui/MasonryGrid";
import { ShowcaseQuizSummaryCard } from "@/components/showcase/ui/QuizSummaryCard";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

interface FeaturedQuizzesHeroProps {
  featuredQuizzes: PublicQuizListItem[];
}

export function FeaturedQuizzesHero({ featuredQuizzes }: FeaturedQuizzesHeroProps) {
  if (featuredQuizzes.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Featured Quizzes</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Explore our handpicked selection of top trivia challenges
        </p>
      </div>

      <ShowcaseMasonryGrid>
        {featuredQuizzes.map((quiz) => (
          <ShowcaseQuizSummaryCard
            key={quiz.id}
            title={quiz.title}
            subtitle={quiz.description || ""}
            category={quiz.sport || "Multi-sport"}
            tags={quiz.topics?.map((t) => t.name) || []}
            coverImageUrl={quiz.descriptionImageUrl || ""}
            href={`/quizzes/${quiz.slug}`}
            meta={{
              durationLabel: quiz.duration ? `${Math.round(quiz.duration / 60)} min` : "Flexible",
              playersLabel: `${quiz._count.attempts.toLocaleString()} players`,
              difficulty: quiz.difficulty,
              rating: quiz.averageRating || 0,
            }}
          />
        ))}
      </ShowcaseMasonryGrid>
    </section>
  );
}

