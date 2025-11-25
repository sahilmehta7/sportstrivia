import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { QuizzesPageHeader } from "@/components/quizzes/quizzes-page-header";
import { QuizzesPageContent } from "./QuizzesPageContent";
import { prisma } from "@/lib/db";
import { QuizListSkeleton } from "@/components/shared/skeletons";
import {
  getPublicQuizList,
  getDailyRecurringQuizzes,
  getComingSoonQuizzes,
} from "@/lib/services/public-quiz.service";
import type { PublicQuizFilters } from "@/lib/dto/quiz-filters.dto";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import { Difficulty } from "@prisma/client";
import { auth } from "@/lib/auth";
import { ItemListJsonLd } from "next-seo";

const HERO_SECTION_LIMIT = 5;
const DEFAULT_PAGE_SIZE = 12;

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

const sportEmojiMap: Record<string, string> = {
  Cricket: "🏏",
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  "Formula 1": "🏎️",
  Olympics: "🏅",
  Rugby: "🏉",
  Golf: "⛳",
  Baseball: "⚾",
  Hockey: "🏒",
};

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
  const limitValue = limitParam
    ? Math.max(1, parseInt(limitParam, 10) || DEFAULT_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
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

const loadTopicsWithQuizCounts = cache(async () => {
  const level0Topics = await prisma.topic.findMany({
    where: {
      parentId: null,
    },
    include: {
      quizTopicConfigs: {
        select: {
          quizId: true,
        },
        where: {
          quiz: {
            isPublished: true,
            status: "PUBLISHED",
          },
        },
      },
      children: {
        include: {
          quizTopicConfigs: {
            select: {
              quizId: true,
            },
            where: {
              quiz: {
                isPublished: true,
                status: "PUBLISHED",
              },
            },
          },
          children: {
            include: {
              quizTopicConfigs: {
                select: {
                  quizId: true,
                },
                where: {
                  quiz: {
                    isPublished: true,
                    status: "PUBLISHED",
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return level0Topics
    .filter((topic) => topic.parentId === null)
    .map((topic) => {
      const quizIds = new Set<string>();

      topic.quizTopicConfigs.forEach((config) => quizIds.add(config.quizId));

      topic.children.forEach((child) => {
        child.quizTopicConfigs.forEach((config) => quizIds.add(config.quizId));

        child.children.forEach((grandchild) => {
          grandchild.quizTopicConfigs.forEach((config) => quizIds.add(config.quizId));
        });
      });

      const quizCount = quizIds.size;
      return { ...topic, quizCount };
    })
    .filter((topic) => topic.quizCount > 0)
    .sort((a, b) => b.quizCount - a.quizCount);
});

async function getFilterGroups(searchParams: SearchParams): Promise<ShowcaseFilterGroup[]> {
  const topicsWithCounts = await loadTopicsWithQuizCounts();
  const topicParam = getParamValue(searchParams.topic);

  const categoryOptions = [
    { value: "all", label: "All Sports" },
    ...topicsWithCounts.map((topic) => ({
      value: topic.slug,
      label: topic.name,
      emoji: sportEmojiMap[topic.name] || "🏆",
      count: topic.quizCount,
    })),
  ];

  return [
    {
      id: "category",
      label: "Category",
      options: categoryOptions,
      activeValue: topicParam || "all",
    },
  ];
}

// Server Component for quizzes listing data
async function QuizzesData({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parsePublicFilters(params || {});

  const session = await auth();
  const userId = session?.user?.id;

  const listingPromise = getPublicQuizList(filters, {
    telemetryUserId: userId,
  });
  const dailyQuizzesPromise = getDailyRecurringQuizzes(userId);
  const comingSoonPromise = getComingSoonQuizzes(6);
  const filterGroupsPromise = getFilterGroups(params || {});

  const listing = await listingPromise;

  const seenFeaturedIds = new Set<string>();
  const inlineFeatured = listing.quizzes.filter((quiz) => {
    if (!quiz.isFeatured) {
      return false;
    }
    seenFeaturedIds.add(quiz.id);
    return true;
  });

  let featuredQuizzes = inlineFeatured.slice(0, HERO_SECTION_LIMIT);

  if (featuredQuizzes.length < HERO_SECTION_LIMIT) {
    const featuredListing = await getPublicQuizList(
      {
        isFeatured: true,
        limit: HERO_SECTION_LIMIT,
        page: 1,
      },
      {
        telemetryEnabled: false,
      }
    );

    for (const quiz of featuredListing.quizzes) {
      if (seenFeaturedIds.has(quiz.id)) {
        continue;
      }
      featuredQuizzes.push(quiz);
      seenFeaturedIds.add(quiz.id);

      if (featuredQuizzes.length === HERO_SECTION_LIMIT) {
        break;
      }
    }
  }

  const [dailyQuizzes, comingSoonQuizzes, filterGroups] = await Promise.all([
    dailyQuizzesPromise,
    comingSoonPromise,
    filterGroupsPromise,
  ]);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  const itemList = listing.quizzes.map((quiz, index) => ({
    position: (listing.pagination.page - 1) * listing.pagination.limit + index + 1,
    url: baseUrl ? `${baseUrl}/quizzes/${quiz.slug}` : `/quizzes/${quiz.slug}`,
    name: quiz.title,
    ...(quiz.descriptionImageUrl ? { image: quiz.descriptionImageUrl } : {}),
    ...(quiz.description ? { description: quiz.description } : {}),
  }));

  return (
    <>
      <QuizzesPageContent
        quizzes={listing.quizzes}
        featuredQuizzes={featuredQuizzes}
        dailyQuizzes={dailyQuizzes}
        comingSoonQuizzes={comingSoonQuizzes}
        filterGroups={filterGroups}
        pagination={listing.pagination}
      />

      {itemList.length > 0 && (
        <ItemListJsonLd
          itemListElements={itemList}
          name="Sports Trivia Quizzes"
        />
      )}
    </>
  );
}

// Fallback for quizzes loading
function QuizzesFallback() {
  return (
    <div className="container mx-auto px-4 pt-12">
      <div className="mb-8">
        <div className="h-10 w-64 rounded bg-muted animate-pulse mb-4" />
        <div className="h-4 w-96 rounded bg-muted animate-pulse" />
      </div>
      <QuizListSkeleton count={12} />
    </div>
  );
}

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  return (
    <>
      <div className="container mx-auto px-4 pt-12">
        <QuizzesPageHeader />
      </div>
      <Suspense fallback={<QuizzesFallback />}>
        <QuizzesData searchParams={searchParams} />
      </Suspense>
    </>
  );
}
