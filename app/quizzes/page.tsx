import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { QuizCard } from "@/components/quizzes/quiz-card";
import { QuizFilterBar } from "@/components/quizzes/quiz-filter-bar";
import { QuizPagination } from "@/components/quizzes/quiz-pagination";
import {
  getPublicQuizFilterOptions,
  getPublicQuizList,
} from "@/lib/services/public-quiz.service";
import type { PublicQuizFilters } from "@/lib/dto/quiz-filters.dto";
import { Difficulty } from "@prisma/client";

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
    isFeatured: getParamValue(searchParams.featured) === "true",
    comingSoon: getParamValue(searchParams.comingSoon) === "true",
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
  searchParams = {},
}: {
  searchParams?: SearchParams;
}) {
  const filters = parsePublicFilters(searchParams);

  const [listing, filterOptions] = await Promise.all([
    getPublicQuizList(filters),
    getPublicQuizFilterOptions(),
  ]);

  const appliedFilters = {
    ...listing.filters,
    search: filters.search,
  };

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  const itemList = listing.quizzes.map((quiz, index) => ({
    "@type": "ListItem",
    position: (listing.pagination.page - 1) * listing.pagination.limit + index + 1,
    url: baseUrl ? `${baseUrl}/quiz/${quiz.slug}` : `/quiz/${quiz.slug}`,
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
        <PageHeader
          title="Discover Sports Trivia Quizzes"
          description="Browse curated quizzes by sport, difficulty, and topic. Use filters to find the perfect challenge and invite friends to compete."
        />

        <QuizFilterBar
          filters={appliedFilters}
          {...filterOptions}
          total={listing.pagination.total}
        />

        <section className="mt-8">
          {listing.quizzes.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listing.quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 p-12 text-center text-muted-foreground">
              <h2 className="text-lg font-semibold text-foreground">No quizzes match your filters yet</h2>
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
