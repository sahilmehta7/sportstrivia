import type { Metadata } from "next";
import { QuizzesPageHeader } from "@/components/quizzes/quizzes-page-header";
import { QuizzesPageContent } from "./QuizzesPageContent";
import { prisma } from "@/lib/db";
import {
  getPublicQuizList,
  getDailyRecurringQuizzes,
  getComingSoonQuizzes,
} from "@/lib/services/public-quiz.service";
import type { PublicQuizFilters } from "@/lib/dto/quiz-filters.dto";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
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

async function getFilterGroups(searchParams: SearchParams): Promise<ShowcaseFilterGroup[]> {
  // Get all level 0 topics (parentId === null) with their hierarchy
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

  // Calculate unique quiz counts including children and sub-children
  const topicsWithCounts = level0Topics
    .filter((topic) => topic.parentId === null) // Extra safety filter for level 0 only
    .map((topic) => {
      // Get all quiz IDs from this topic and its descendants
      const quizIds = new Set<string>();
      
      // Add quizzes from the topic itself
      topic.quizTopicConfigs.forEach((config) => quizIds.add(config.quizId));
      
      // Add quizzes from direct children
      topic.children.forEach((child) => {
        child.quizTopicConfigs.forEach((config) => quizIds.add(config.quizId));
        
        // Add quizzes from grandchildren
        child.children.forEach((grandchild) => {
          grandchild.quizTopicConfigs.forEach((config) => quizIds.add(config.quizId));
        });
      });
      
      const quizCount = quizIds.size;
      return { ...topic, quizCount };
    })
    .filter((topic) => topic.quizCount > 0) // Only include topics with at least one quiz
    .sort((a, b) => b.quizCount - a.quizCount);

  // Map topics to filter options with emojis
  const sportEmojiMap: Record<string, string> = {
    "Cricket": "🏏",
    "Football": "⚽",
    "Basketball": "🏀",
    "Tennis": "🎾",
    "Formula 1": "🏎️",
    "Olympics": "🏅",
    "Rugby": "🏉",
    "Golf": "⛳",
    "Baseball": "⚾",
    "Hockey": "🏒",
  };

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

  const [listing, featuredListing, dailyQuizzes, comingSoonQuizzes, filterGroups] = await Promise.all([
    getPublicQuizList(filters),
    // Fetch featured quizzes for hero section
    getPublicQuizList({ isFeatured: true, limit: 5, page: 1 }),
    // Fetch daily recurring quizzes with user completion data
    getDailyRecurringQuizzes(userId),
    // Fetch upcoming quizzes with future start dates
    getComingSoonQuizzes(6),
    // Fetch filter groups
    getFilterGroups(params || {}),
  ]);

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
    <>
      <div className="container mx-auto px-4 pt-12">
        <QuizzesPageHeader />
      </div>
      
      <QuizzesPageContent
        quizzes={listing.quizzes}
        featuredQuizzes={featuredListing.quizzes}
        dailyQuizzes={dailyQuizzes}
        comingSoonQuizzes={comingSoonQuizzes}
        filterGroups={filterGroups}
        pagination={listing.pagination}
      />
      
      {itemList.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
