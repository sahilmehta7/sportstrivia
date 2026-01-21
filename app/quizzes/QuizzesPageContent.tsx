"use client";

import { FeaturedTradingCardsCarousel } from "@/components/quizzes/featured-trading-cards-carousel";
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
    <main className="min-h-screen pb-24">
      <PageContainer>
        <div className="space-y-16">
          {/* Featured Quizzes Hero Section */}
          {featuredQuizzes.length > 0 && (
            <section>
              <FeaturedTradingCardsCarousel quizzes={featuredQuizzes} />
            </section>
          )}

          {/* Daily Recurring Quizzes */}
          {dailyQuizzes.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-4 px-1">
                <div className="h-6 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <h2 className="text-2xl font-black tracking-tight uppercase">Daily Arenas</h2>
              </div>
              <ShowcaseDailyCarousel dailyQuizzes={dailyQuizzes} />
            </section>
          )}

          {/* Coming Soon Section */}
          {comingSoonQuizzes.length > 0 && (
            <ComingSoonWidget quizzes={comingSoonQuizzes} />
          )}

          {/* Main Library */}
          <QuizzesContent
            quizzes={quizzes}
            filterGroups={filterGroups}
            pagination={pagination}
          />
        </div>
      </PageContainer>
    </main>
  );
}
