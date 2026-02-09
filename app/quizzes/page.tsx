import { Suspense } from "react";
import type { Metadata } from "next";
import { QuizzesPageHeader } from "@/components/quizzes/quizzes-page-header";
import { PageContainer } from "@/components/shared/PageContainer";
import { SearchParams } from "./quiz-utils";

// New Section Components
import { DailyChallengeSection, DailyChallengeSkeleton } from "./components/daily-challenge-section";
import { FeaturedSection, FeaturedSectionSkeleton } from "./components/featured-section";
import { DailyRecurringSection, DailyRecurringSkeleton } from "./components/daily-recurring-section";
import { ComingSoonSection, ComingSoonSkeleton } from "./components/coming-soon-section";
import { QuizListSection, QuizListSectionSkeleton } from "./components/quiz-list-section";

// Route segment config
export const dynamic = 'auto';
export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "Browse Sports Trivia Quizzes | Sports Trivia Platform",
  description:
    "Discover curated sports trivia quizzes by sport, difficulty, and topic. Filter, sort, and find the perfect challenge to test your sports knowledge.",
  alternates: {
    canonical: "/quizzes",
  },
  openGraph: {
    title: "Browse Sports Trivia Quizzes",
    description:
      "Explore featured, top-rated, and trending sports trivia quizzes. Filter by sport, difficulty, and more to find your next challenge.",
    url: "/quizzes",
    type: "website",
  },
};

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) || {};

  return (
    <main className="min-h-screen pb-24">
      <PageContainer className="pt-6 md:pt-12">
        <QuizzesPageHeader />

        <div className="space-y-16 mt-12">
          {/* Daily Challenge Hero */}
          <Suspense fallback={<DailyChallengeSkeleton />}>
            <DailyChallengeSection />
          </Suspense>

          {/* Featured Quizzes (Only shown if no strict filters are applied, or we always show them?) */}
          {/* In original design, they were always under "Featured" or "Trading Cards". Let's keep them always visible at top */}
          <Suspense fallback={<FeaturedSectionSkeleton />}>
            <FeaturedSection />
          </Suspense>

          {/* Daily Recurring Quizzes */}
          <Suspense fallback={<DailyRecurringSkeleton />}>
            <DailyRecurringSection />
          </Suspense>

          {/* Coming Soon Section */}
          <Suspense fallback={<ComingSoonSkeleton />}>
            <ComingSoonSection />
          </Suspense>

          {/* Main Library */}
          <Suspense fallback={<QuizListSkeleton />}>
            <QuizListSection searchParams={params} />
          </Suspense>
        </div>
      </PageContainer>
    </main>
  );
}

function QuizListSkeleton() {
  return <QuizListSectionSkeleton />;
}
