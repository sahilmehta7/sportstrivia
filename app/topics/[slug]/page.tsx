import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma, Difficulty, SearchContext } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getTopicIdsWithDescendants } from "@/lib/services/topic.service";
import {
  getPublicQuizList,
  getPublicQuizFilterOptions,
  publicQuizCardSelect,
  type PublicQuizListItem,
} from "@/lib/services/public-quiz.service";
import { buildTopicLeaderboard, type LeaderboardPeriod } from "@/lib/services/leaderboard.service";
import { BreadcrumbJsonLd } from "next-seo";
import { ItemListStructuredData } from "@/components/seo/ItemListStructuredData";
import { getCanonicalUrl } from "@/lib/next-seo-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopicHero } from "@/components/topics/topic-hero";
import { FeaturedRow } from "@/components/quizzes/featured-row";
import { FeaturedQuizzesHero } from "@/components/quizzes/featured-quizzes-hero";
import { ModernFilterBar } from "@/components/quizzes/modern-filter-bar";
import { QuizCard } from "@/components/quizzes/quiz-card";
import { QuizPagination } from "@/components/quizzes/quiz-pagination";
import { StreakIndicator } from "@/components/shared/StreakIndicator";
import { AISuggestionModal } from "@/components/topics/ai-suggestion-modal";
import { TopicQuizSearchBar } from "@/components/topics/topic-search-bar";
import {
  getRecentSearchQueriesForUser,
  getTrendingSearchQueries,
} from "@/lib/services/search-query.service";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";

const topicWithRelations = {
  include: {
    parent: {
      select: { id: true, name: true, slug: true },
    },
    children: {
      orderBy: { name: "asc" as const },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        level: true,
        _count: {
          select: {
            questions: true,
            children: true,
          },
        },
      },
    },
    _count: {
      select: {
        questions: true,
        children: true,
        quizTopicConfigs: true,
      },
    },
  },
} satisfies Prisma.TopicDefaultArgs;

type _TopicWithRelations = Prisma.TopicGetPayload<typeof topicWithRelations>;

const fetchTopicBySlug = cache(async (slug: string) => {
  return prisma.topic.findUnique({
    where: { slug },
    ...topicWithRelations,
  });
});

async function fetchFeaturedQuizzesForTopic(topicIds: string[]): Promise<PublicQuizListItem[]> {
  if (topicIds.length === 0) {
    return [];
  }

  return prisma.quiz.findMany({
    where: {
      isPublished: true,
      isFeatured: true,
      OR: [
        {
          topicConfigs: {
            some: {
              topicId: { in: topicIds },
            },
          },
        },
        {
          questionPool: {
            some: {
              question: {
                topicId: { in: topicIds },
              },
            },
          },
        },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
    select: publicQuizCardSelect,
    take: 6,
  });
}

import { generateTopicMetadataAI } from "@/lib/services/ai-seo.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await fetchTopicBySlug(slug);

  if (!topic) {
    return {};
  }

  // Try AI-generated metadata first
  const aiMetadata = await generateTopicMetadataAI(topic.name, topic.description);

  const title = aiMetadata?.title || `${topic.name} Trivia Quizzes | Sports Trivia`;
  const description = aiMetadata?.description || (topic.description
    ? topic.description.length > 160
      ? `${topic.description.slice(0, 157)}...`
      : topic.description
    : `Explore trivia quizzes, key facts, and highlights for ${topic.name} on Sports Trivia.`);
  const keywords = aiMetadata?.keywords || [topic.name.toLowerCase(), "trivia", "quiz", "sports"];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sportstrivia.in";

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${baseUrl}/topics/${topic.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TopicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const topic = await fetchTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  const user = await getCurrentUser();
  const userStreak = user
    ? await prisma.user.findUnique({
      where: { id: user.id },
      select: { currentStreak: true, longestStreak: true },
    })
    : null;

  const topicIds = await getTopicIdsWithDescendants(topic.id);
  const heroFeaturedQuizzesPromise = fetchFeaturedQuizzesForTopic(topicIds);

  const getParamValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value ?? undefined;

  const searchTerm = getParamValue(sp.search);
  const pageParam = getParamValue(sp.page);
  const limitParam = getParamValue(sp.limit);
  const minRatingParam = getParamValue(sp.minRating);

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const limitValue = limitParam ? Math.max(1, parseInt(limitParam, 10) || 12) : 12;
  const limit = Math.min(limitValue, 50);

  const difficultyValue = getParamValue(sp.difficulty);
  const difficultyParam =
    difficultyValue && Object.values(Difficulty).includes(difficultyValue as Difficulty)
      ? (difficultyValue as Difficulty)
      : undefined;

  const sortByValue = getParamValue(sp.sortBy);
  const sortByParam =
    sortByValue && ["popularity", "rating", "createdAt"].includes(sortByValue)
      ? (sortByValue as "popularity" | "rating" | "createdAt")
      : "createdAt";

  const sortOrderValue = getParamValue(sp.sortOrder);
  const sortOrderParam = sortOrderValue === "asc" || sortOrderValue === "desc" ? sortOrderValue : "desc";

  const [listing, filterOptions, heroFeaturedQuizzes, topRatedListing] = await Promise.all([
    getPublicQuizList(
      {
        topic: slug,
        page,
        limit,
        search: searchTerm,
        sport: getParamValue(sp.sport),
        difficulty: difficultyParam,
        tag: getParamValue(sp.tag),
        minRating:
          minRatingParam && !Number.isNaN(parseFloat(minRatingParam))
            ? parseFloat(minRatingParam)
            : undefined,
        sortBy: sortByParam,
        sortOrder: sortOrderParam,
      },
      {
        telemetryUserId: user?.id,
      }
    ),
    getPublicQuizFilterOptions(),
    heroFeaturedQuizzesPromise,
    getPublicQuizList({ topic: slug, sortBy: "rating", sortOrder: "desc", page: 1, limit: 10 }),
  ]);

  let quizSearchSuggestions: { value: string; label: string }[] = [];
  try {
    const [trendingQuizSearches, recentQuizSearches] = await Promise.all([
      getTrendingSearchQueries(SearchContext.QUIZ, { limit: 6 }),
      user?.id
        ? getRecentSearchQueriesForUser(user.id, SearchContext.QUIZ, { limit: 4 })
        : Promise.resolve([]),
    ]);

    const formatChipLabel = (value: string) =>
      value
        .split(" ")
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
        .join(" ");

    const suggestionMap = new Map<string, { value: string; label: string }>();

    trendingQuizSearches.forEach((entry) => {
      const label = formatChipLabel(entry.query);
      suggestionMap.set(entry.query, { value: entry.query, label });
    });

    recentQuizSearches.forEach((entry) => {
      if (!suggestionMap.has(entry.query)) {
        const label = formatChipLabel(entry.query);
        suggestionMap.set(entry.query, { value: entry.query, label });
      }
    });

    const topicKey = topic.name.toLowerCase();
    if (!suggestionMap.has(topicKey)) {
      suggestionMap.set(topicKey, { value: topic.name, label: topic.name });
    }

    quizSearchSuggestions = Array.from(suggestionMap.values()).slice(0, 6);
  } catch {
    quizSearchSuggestions = [{ value: topic.name, label: topic.name }];
  }

  const appliedFilters = {
    ...listing.filters,
    topic: slug,
  } as {
    sport?: string;
    difficulty?: Difficulty;
    tag?: string;
    topic?: string;
    sortBy?: "popularity" | "rating" | "createdAt";
    sortOrder?: "asc" | "desc";
    minRating?: number;
  };

  async function buildTopicDatasets(topicId: string) {
    const periods: LeaderboardPeriod[] = ["daily", "all-time"];
    const [daily, allTime] = await Promise.all([
      buildTopicLeaderboard(topicId, periods[0], 10),
      buildTopicLeaderboard(topicId, periods[1], 10),
    ]);

    const toDataset = (entries: any[]) =>
      entries.map((entry: any, index: number) => ({
        rank: index + 1,
        userId: entry.userId,
        name: entry.userName ?? "Anonymous Fan",
        image: entry.userImage ?? null,
        score: entry.score ?? 0,
      }));

    return {
      daily: toDataset(daily).slice(0, 5),
      allTime: toDataset(allTime).slice(0, 5),
    };
  }

  const leaderboards = await buildTopicDatasets(topic.id);

  const heroPrimaryQuiz =
    heroFeaturedQuizzes[0] ??
    topRatedListing.quizzes[0] ??
    listing.quizzes[0] ??
    null;

  // Generate structured data for next-seo components
  const breadcrumbItems = [
    { position: 1, name: "Home", item: getCanonicalUrl("/") },
  ];
  if (topic.parent) {
    breadcrumbItems.push({
      position: breadcrumbItems.length + 1,
      name: topic.parent.name,
      item: getCanonicalUrl(`/topics/${topic.parent.slug}`)
    });
  }
  breadcrumbItems.push({
    position: breadcrumbItems.length + 1,
    name: topic.name,
    item: getCanonicalUrl(`/topics/${topic.slug}`)
  });

  const itemListElements = listing.quizzes.length > 0
    ? listing.quizzes.map((q, index) => ({
      position: index + 1,
      name: q.title,
      item: getCanonicalUrl(`/quizzes/${q.slug}`),
      ...(q.descriptionImageUrl ? { image: q.descriptionImageUrl } : {}),
      ...(q.description ? { description: q.description } : {}),
    }))
    : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <PageContainer className="space-y-8 pb-16 pt-10">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          {topic.parent ? (
            <>
              <Link
                href={`/topics/${topic.parent.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {topic.parent.name}
              </Link>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </>
          ) : null}
          <span className="font-semibold text-foreground">{topic.name}</span>
        </nav>

        <TopicHero
          title={topic.name}
          subtitle={
            topic.description || `Discover quizzes, stats, and storylines for ${topic.name}.`
          }
          primaryCta={
            heroPrimaryQuiz
              ? { label: "Start a quiz", href: `/quizzes/${heroPrimaryQuiz.slug}` }
              : undefined
          }
          secondaryCta={listing.pagination.total > 0 ? { label: "View all quizzes", href: "#topic-quizzes" } : undefined}
        />

        <ShowcaseThemeProvider>
          <TopicQuizSearchBar
            initialQuery={searchTerm ?? ""}
            suggestions={quizSearchSuggestions}
          />
        </ShowcaseThemeProvider>

        {heroFeaturedQuizzes.length > 0 && (
          <FeaturedQuizzesHero featuredQuizzes={heroFeaturedQuizzes} />
        )}

        {topRatedListing.quizzes.length > 0 && (
          <FeaturedRow
            title="Top rated by fans"
            description="Quizzes the community keeps replaying"
            quizzes={topRatedListing.quizzes.slice(0, 6)}
          />
        )}

        {topic.children.length > 0 && (
          <section className="space-y-4" id="topic-subtopics">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Related topics</h2>
              <p className="text-sm text-muted-foreground">
                Discover more angles connected to {topic.name}.
              </p>
            </div>
            <div className="-mx-4 overflow-x-auto px-4">
              <div className="flex gap-4">
                {topic.children.map((child) => (
                  <Link key={child.id} href={`/topics/${child.slug}`} className="flex-none">
                    <Card className="h-full w-72 overflow-hidden border border-border/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                      <CardHeader className="space-y-2 p-5">
                        <CardTitle className="truncate text-lg">{child.name}</CardTitle>
                        <CardDescription className="line-clamp-3 text-sm text-muted-foreground">
                          {child.description || `Explore quizzes focused on ${child.name}.`}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="space-y-6" id="topic-quizzes">
          <ModernFilterBar
            filters={appliedFilters}
            {...filterOptions}
            total={listing.pagination.total}
          />

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
            <div className="space-y-6">
              {listing.quizzes.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {listing.quizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz as any} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No published quizzes include {topic.name} yet. Check back soon for new challenges.
                  </CardContent>
                </Card>
              )}

              <QuizPagination
                page={listing.pagination.page}
                pages={listing.pagination.pages}
                total={listing.pagination.total}
                pageSize={listing.pagination.limit}
              />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <Card className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Top fans (all-time)</CardTitle>
                  <CardDescription>Correct answers in this topic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leaderboards.allTime.length > 0 ? (
                    leaderboards.allTime.map((entry) => (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                            {entry.rank}
                          </span>
                          <span className="font-medium text-foreground">{entry.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{entry.score} correct</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Be the first to climb this leaderboard.</p>
                  )}
                  <Link
                    href={`/leaderboard?topic=${topic.slug}`}
                    className="text-sm font-medium text-primary transition hover:text-primary/80"
                  >
                    View full leaderboards
                  </Link>
                </CardContent>
              </Card>

              {userStreak && (
                <Card className="rounded-2xl border border-border/40 bg-gradient-to-br from-amber-500/10 via-background to-background shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Your streak</CardTitle>
                    <CardDescription>Keep the momentum going</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <StreakIndicator
                      currentStreak={userStreak.currentStreak}
                      longestStreak={userStreak.longestStreak}
                      showLabel
                    />
                    <p className="text-muted-foreground">
                      Answer a quiz today to extend your streak and climb the rankings.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-2xl border border-border/40 bg-gradient-to-br from-purple-500/10 via-background to-background shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Need inspiration?</CardTitle>
                  <CardDescription>Let AI whip up a fresh quiz idea</CardDescription>
                </CardHeader>
                <CardContent>
                  <AISuggestionModal
                    topicName={topic.name}
                    trigger={
                      <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                        Generate with AI
                      </button>
                    }
                  />
                </CardContent>
              </Card>
            </aside>
          </div>
        </section>
      </PageContainer>

      {/* Structured Data */}
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ItemListStructuredData itemListElements={itemListElements} name={`${topic.name} Quizzes`} />
    </main>
  );
}
