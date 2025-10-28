import type { Metadata } from "next";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import { ShowcaseQuizListing } from "@/components/quiz/ShowcaseQuizListing";
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
  title: "Quiz Listing Showcase",
  description: "Showcase of quiz listing page with glassmorphism theme and modern filtering",
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

export default async function QuizListingShowcasePage({
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

  return (
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Quiz Listing"
        subtitle="Modern quiz listing page with advanced filtering, search, and glassmorphism design"
        badge="LISTING SHOWCASE"
        variant="default"
        breadcrumbs={[{ label: "Layouts", href: "/showcase" }, { label: "Quiz Listing" }]}
      >
        <ShowcaseQuizListing
          listing={listing}
          filterOptions={filterOptions}
          appliedFilters={appliedFilters}
          featuredQuizzes={featuredListing.quizzes}
          dailyQuizzes={dailyQuizzes}
          comingSoonQuizzes={comingSoonQuizzes}
        />
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
