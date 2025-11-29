"use client";

import { FeaturedQuizzesHero } from "@/components/quizzes/featured-quizzes-hero";
import { ComingSoonWidget } from "@/components/quizzes/coming-soon-widget";
import { ShowcaseDailyCarousel } from "@/components/showcase/ShowcaseDailyCarousel";
import { QuizzesContent } from "./QuizzesContent";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import type { PublicQuizListItem, DailyQuizItem, ComingSoonQuiz } from "@/lib/services/public-quiz.service";
import { PageContainer } from "@/components/shared/PageContainer";

interface QuizzesPageContentProps {
  quizzes: PublicQuizListItem[];
  featuredQuizzes: PublicQuizListItem[];
  dailyQuizzes: DailyQuizItem[];
  comingSoonQuizzes: ComingSoonQuiz[];
  filterGroups: ShowcaseFilterGroup[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export function QuizzesPageContent({
  quizzes,
  featuredQuizzes,
  dailyQuizzes,
  comingSoonQuizzes,
  filterGroups,
  pagination,
}: QuizzesPageContentProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 py-12">
      <PageContainer>
        {/* Featured Quizzes Hero Section */}
        {featuredQuizzes.length > 0 && (
          <FeaturedQuizzesHero featuredQuizzes={featuredQuizzes} />
        )}

        {/* Daily Recurring Quizzes */}
        <ShowcaseDailyCarousel dailyQuizzes={dailyQuizzes} />

        {/* Coming Soon Widget */}
        <ComingSoonWidget quizzes={comingSoonQuizzes} />

        {/* Quizzes Content with Filters */}
        <QuizzesContent 
          quizzes={quizzes}
          filterGroups={filterGroups}
          pagination={pagination}
        />
      </PageContainer>
    </main>
  );
}
