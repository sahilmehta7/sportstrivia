import type { Metadata } from "next";
import { QuizCard } from "@/components/quizzes/quiz-card";
import { ModernFilterBar } from "@/components/quizzes/modern-filter-bar";
import { QuizPagination } from "@/components/quizzes/quiz-pagination";
import { QuizzesPageHeader } from "@/components/quizzes/quizzes-page-header";
import { FeaturedQuizzesHero } from "@/components/quizzes/featured-quizzes-hero";
import { ComingSoonWidget } from "@/components/quizzes/coming-soon-widget";
import { DailyQuizWidget } from "@/components/quizzes/daily-quiz-widget";
import {
  getPublicQuizFilterOptions,
  getPublicQuizList,
  getDailyRecurringQuizzes,
  getComingSoonQuizzes,
} from "@/lib/services/public-quiz.service";
import type { PublicQuizFilters } from "@/lib/dto/quiz-filters.dto";
import { Difficulty } from "@prisma/client";
import { auth } from "@/lib/auth";

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

const DEFAULT_PAGE_SIZE = 12;

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
}

function parsePublicFilters(searchParams: SearchParams): PublicQuizFilters {
  const pageParam = getParamValue(searchParams.page);
  const limitParam = getParamValue(searchParams.limit);
  const minDurationParam = getParamValue(searchParams.minDuration);
  const maxDurationParam = getParamValue(searchParams.maxDuration);
  const minRatingParam = getParamValue(searchParams.minRating);

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const limitValue = limitParam ? Math.max(1, parseInt(limitParam, 10) || DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  const limit = Math.min(limitValue, 50);

  const difficultyValue = getParamValue(searchParams.difficulty);
  const difficultyParam =
    difficultyValue && Object.values(Difficulty).includes(difficultyValue as Difficulty)
      ? (difficultyValue as Difficulty)
      : undefined;

  const sortByValue = getParamValue(searchParams.sortBy);
  const sortByParam =
    sortByValue && ["popularity", "rating", "createdAt"].includes(sortByValue)
      ? (sortByValue as "popularity" | "rating" | "createdAt")
      : "createdAt";

  const sortOrderValue = getParamValue(searchParams.sortOrder);
  const sortOrderParam = sortOrderValue === "asc" || sortOrderValue === "desc" ? sortOrderValue : "desc";

  return {
    page,
    limit,
    search: getParamValue(searchParams.search),
    sport: getParamValue(searchParams.sport),
    difficulty: difficultyParam,
    tag: getParamValue(searchParams.tag),
    topic: getParamValue(searchParams.topic),
    minDuration: minDurationParam ? parseInt(minDurationParam, 10) * 60 : undefined,
    maxDuration: maxDurationParam ? parseInt(maxDurationParam, 10) * 60 : undefined,
    minRating:
      minRatingParam && !Number.isNaN(parseFloat(minRatingParam))
        ? parseFloat(minRatingParam)
        : undefined,
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
  };
}

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parsePublicFilters(params || {});
  
  // Get current user session
  const session = await auth();
  const userId = session?.user?.id;

  const [listing, filterOptions, featuredListing, dailyQuizzes, comingSoonQuizzes] = await Promise.all([
    getPublicQuizList(filters),
    getPublicQuizFilterOptions(),
    // Fetch featured quizzes for hero section
    getPublicQuizList({ isFeatured: true, limit: 5, page: 1 }),
    // Fetch daily recurring quizzes with user completion data
    getDailyRecurringQuizzes(userId),
    // Fetch upcoming quizzes with future start dates
    getComingSoonQuizzes(6),
  ]);

  const appliedFilters = {
    ...listing.filters,
  };

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  const itemList = listing.quizzes.map((quiz, index) => ({
    "@type": "ListItem",
    position: (listing.pagination.page - 1) * listing.pagination.limit + index + 1,
    url: baseUrl ? `${baseUrl}/quizzes/${quiz.slug}` : `/quizzes/${quiz.slug}`,
    name: quiz.title,
    image: quiz.descriptionImageUrl ?? undefined,
    description: quiz.description ?? undefined,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Sports Trivia Quizzes",
    itemListElement: itemList,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 py-12">
      <div className="container mx-auto px-4">
        <QuizzesPageHeader />

        {/* Featured Quizzes Hero Section */}
        {featuredListing.quizzes.length > 0 && (
          <FeaturedQuizzesHero featuredQuizzes={featuredListing.quizzes} />
        )}

        {/* Daily Recurring Quizzes */}
        <DailyQuizWidget dailyQuizzes={dailyQuizzes} />

        {/* Coming Soon Widget */}
        <ComingSoonWidget quizzes={comingSoonQuizzes} />

        {/* Modern Filter Bar */}
        <ModernFilterBar
          filters={appliedFilters}
          {...filterOptions}
          total={listing.pagination.total}
        />

        {/* Quiz Grid */}
        <section className="mt-8">
          {listing.quizzes.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listing.quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
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
          page={listing.pagination.page}
          pages={listing.pagination.pages}
          total={listing.pagination.total}
          pageSize={listing.pagination.limit}
        />
      </div>
      {itemList.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </main>
  );
}
