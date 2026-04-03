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
import {
  FeaturedCollectionsSection,
  FeaturedCollectionsSectionSkeleton,
} from "./components/featured-collections-section";
import {
  AllSportsTopicsWidgetSection,
  AllSportsTopicsWidgetSectionSkeleton,
} from "./components/all-sports-topics-widget-section";

// Route segment config
export const dynamic = 'auto';
export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "Sports Trivia Quiz Rails | Browse by Sport",
  description:
    "Explore sports trivia in horizontal rails built by sport. Jump into deep quiz libraries, daily challenges, featured collections, and fresh releases.",
  alternates: {
    canonical: "/quizzes",
  },
  openGraph: {
    title: "Sports Trivia Quiz Rails",
    description:
      "Browse quizzes by sport with horizontal rails, daily challenges, and featured collections to find your next trivia run.",
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

        <div className="mt-4 space-y-10 md:mt-12 md:space-y-16">

          {/* Featured Quizzes */}
          <Suspense fallback={<FeaturedSectionSkeleton />}>
            <FeaturedSection />
          </Suspense>

          <Suspense fallback={<AllSportsTopicsWidgetSectionSkeleton />}>
            <AllSportsTopicsWidgetSection />
          </Suspense>

          {/* Daily Challenge Hero */}
          <Suspense fallback={<DailyChallengeSkeleton />}>
            <DailyChallengeSection />
          </Suspense>



          <Suspense fallback={<FeaturedCollectionsSectionSkeleton />}>
            <FeaturedCollectionsSection />
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
