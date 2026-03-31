import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma, Difficulty } from "@prisma/client";
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
import { getCanonicalUrl, BASE_URL } from "@/lib/next-seo-config";
import { StructuredData } from "@/components/seo/StructuredData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopicFollowButton } from "@/components/topics/TopicFollowButton";
import { CollectionRail } from "@/components/collections/CollectionRail";
import { TopicAuthoritySection } from "@/components/topics/topic-authority-section";
import { TopicAuthorityContainer } from "@/components/topics/topic-authority-container";
import { FeaturedRow } from "@/components/quizzes/featured-row";
import { FeaturedTradingCardsCarousel } from "@/components/quizzes/featured-trading-cards-carousel";
import { ModernFilterBar } from "@/components/quizzes/modern-filter-bar";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { getSportGradient } from "@/lib/quiz-formatters";
import { QuizPagination } from "@/components/quizzes/quiz-pagination";
import { StreakIndicator } from "@/components/shared/StreakIndicator";
import { TopicDescription } from "@/components/topics/TopicDescription";

import { ChevronRight, ShieldCheck } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { getFAQSchema, getTopicGraphSchema, getBreadcrumbSchema, getItemListSchema } from "@/lib/schema-utils";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";
import { parseFaqMarkdown } from "@/lib/faq-utils";
import { listPublishedCollectionsSafe } from "@/lib/services/collection.service";

const topicWithRelations = {
  include: {
    parent: {
      select: {
        id: true,
        name: true,
        slug: true,
        schemaType: true,
        schemaCanonicalUrl: true,
        schemaSameAs: true,
        schemaEntityData: true,
      },
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

const fetchTopicBySlug = async (slug: string) => {
  return prisma.topic.findUnique({
    where: { slug },
    ...topicWithRelations,
  });
};

const fetchPublishedSnapshot = async (topicId: string) =>
  prisma.topicContentSnapshot.findFirst({
    where: { topicId, status: "PUBLISHED" },
    orderBy: [{ version: "desc" }],
  });

async function fetchFeaturedQuizzesForTopic(topicIds: string[]): Promise<PublicQuizListItem[]> {
  if (topicIds.length === 0) {
    return [];
  }

  return prisma.quiz.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
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

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function sanitizeTopicSnippet(raw: string | null | undefined, topicName: string): string {
  if (!raw) return `Explore quizzes focused on ${topicName}.`;
  const stripped = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\[(?:https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, "$1")
    .replace(/\[[0-9]+\]/g, " ")
    .replace(/=+\s*[^=]*\s*=+/g, " ")
    .replace(/'''?|''/g, " ")
    .replace(/[_*`>#]/g, " ")
    .replace(/\b(?:citation needed|edit)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!stripped || stripped.length < 24) {
    return `Explore quizzes focused on ${topicName}.`;
  }

  const firstSentence = stripped.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";
  const candidate = firstSentence.length >= 30 ? firstSentence : stripped;
  return candidate.slice(0, 160);
}



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

  const publishedSnapshot = await fetchPublishedSnapshot(topic.id);

  // Use stored SEO metadata or fallback to templates
  const title = publishedSnapshot?.title || topic.seoTitle || `${topic.name} Trivia Quizzes | Sports Trivia`;
  const description = publishedSnapshot?.metaDescription || topic.seoDescription || (topic.description
    ? topic.description.length > 160
      ? `${topic.description.slice(0, 157)}...`
      : topic.description
    : `Explore trivia quizzes, key facts, and highlights for ${topic.name} on Sports Trivia.`);
  const keywords = topic.seoKeywords.length > 0 ? topic.seoKeywords : [topic.name.toLowerCase(), "trivia", "quiz", "sports"];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sportstrivia.in";

  return {
    title,
    description,
    keywords,
    robots: topic.indexEligible ? undefined : { index: false, follow: true },
    alternates: {
      canonical: getCanonicalUrl(`/topics/${topic.slug}`),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: getCanonicalUrl(`/topics/${topic.slug}`),
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
  const followRecord = user
    ? await prisma.userFollowedTopic.findUnique({
        where: {
          userId_topicId: {
            userId: user.id,
            topicId: topic.id,
          },
        },
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
  const topicCollections = await listPublishedCollectionsSafe(
    {
      page: 1,
      limit: 6,
      topicId: topic.id,
    },
    "topics/[slug]/topic-collection-rail"
  );

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
  const publishedSnapshot = await fetchPublishedSnapshot(topic.id);
  const showAuthority = Boolean(topic.contentStatus === "PUBLISHED" && publishedSnapshot);
  const listingQuizIds = new Set(listing.quizzes.map((quiz) => quiz.id));
  const dedupedHeroFeatured = heroFeaturedQuizzes.filter((quiz) => !listingQuizIds.has(quiz.id));
  const dedupedTopRated = topRatedListing.quizzes.filter((quiz) => !listingQuizIds.has(quiz.id)).slice(0, 6);

  const heroPrimaryQuiz =
    listing.quizzes[0] ??
    dedupedHeroFeatured[0] ??
    topRatedListing.quizzes[0] ??
    null;

  // Generate centralized structured data graph
  const breadcrumbs = [
    { name: "Home", url: "/" },
    ...(topic.parent ? [{ name: topic.parent.name, url: `/topics/${topic.parent.slug}` }] : []),
    { name: topic.name, url: `/topics/${topic.slug}` },
  ];

  const topicGraphSchema = getTopicGraphSchema({
    topic: {
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      parentId: topic.parentId,
      schemaType: topic.schemaType as TopicSchemaTypeValue,
      schemaCanonicalUrl: topic.schemaCanonicalUrl,
      schemaSameAs: topic.schemaSameAs,
      schemaEntityData: (topic.schemaEntityData as Record<string, unknown> | null) ?? null,
      parent: topic.parent
        ? {
            name: topic.parent.name,
            slug: topic.parent.slug,
            schemaType: topic.parent.schemaType as TopicSchemaTypeValue,
            schemaCanonicalUrl: topic.parent.schemaCanonicalUrl,
            schemaSameAs: topic.parent.schemaSameAs,
          }
        : null,
    },
    quizUrls: listing.quizzes.map((quiz) => getCanonicalUrl(`/quizzes/${quiz.slug}`)),
  });
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbs);
  const itemListSchema = getItemListSchema(
    listing.quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description,
      descriptionImageUrl: quiz.descriptionImageUrl,
    })),
    `${topic.name} Quizzes`
  );
  const faqItems = showAuthority && publishedSnapshot ? parseFaqMarkdown(publishedSnapshot.faqMd) : [];
  const faqSchema = faqItems.length > 0 ? getFAQSchema(faqItems) : null;

  return (
    <main className="min-h-screen pb-24">
      <PageContainer className="pt-6 md:pt-12">
        <div className="mt-4 space-y-8 md:mt-12 md:space-y-12">
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

        <section className="hidden space-y-6 md:block">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 border border-foreground/10 px-4 py-1.5 bg-muted/30">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Topic Intelligence</span>
            </div>
            <h1 className="text-6xl font-bold tracking-tighter lg:text-8xl uppercase leading-[0.85] font-['Barlow_Condensed',sans-serif] text-foreground">
              {topic.name}
            </h1>
            <TopicDescription 
              description={topic.description || `Discover quizzes, stats, and storylines for ${topic.name}.`}
              className="mx-auto lg:mx-0 text-xl text-muted-foreground font-semibold tracking-tight leading-tight"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <TopicFollowButton
              topicId={topic.id}
              topicName={topic.name}
              schemaType={topic.schemaType as TopicSchemaTypeValue}
              entityStatus={topic.entityStatus}
              initialIsFollowing={Boolean(followRecord)}
              isAuthenticated={Boolean(user)}
              layout="desktop"
            />
            <Link
              href="#topic-quizzes"
              className="inline-flex items-center rounded-none border border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground"
            >
              Browse all
            </Link>
            <Link
              href="#topic-key-facts"
              className="inline-flex items-center rounded-none border border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground"
            >
              Key facts
            </Link>
            <Link
              href="#topic-faq"
              className="inline-flex items-center rounded-none border border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground"
            >
              FAQ
            </Link>
          </div>
        </section>

        <section className="space-y-6 md:hidden">
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Topic Intelligence</p>
            <h1 className="text-5xl font-bold uppercase leading-[0.85] tracking-tighter font-['Barlow_Condensed',sans-serif] text-foreground">
              {topic.name}
            </h1>
            <TopicDescription 
              description={topic.description || `Discover quizzes, stats, and storylines for ${topic.name}.`}
              className="text-base font-medium leading-relaxed tracking-tight text-muted-foreground"
            />
          </div>
          <div className="space-y-3">
            <TopicFollowButton
              topicId={topic.id}
              topicName={topic.name}
              schemaType={topic.schemaType as TopicSchemaTypeValue}
              entityStatus={topic.entityStatus}
              initialIsFollowing={Boolean(followRecord)}
              isAuthenticated={Boolean(user)}
              layout="mobile"
            />
            <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 pb-2 pt-1 -mx-4 px-4">
              <Link
                href="#topic-quizzes"
                className="shrink-0 snap-start inline-flex min-h-[44px] items-center justify-center rounded-none border border-border px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground bg-background/50 backdrop-blur-sm transition-transform active:scale-[0.98]"
              >
                Browse all
              </Link>
              <Link
                href="#topic-key-facts"
                className="shrink-0 snap-start inline-flex min-h-[44px] items-center justify-center rounded-none border border-border px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground bg-background/50 backdrop-blur-sm transition-transform active:scale-[0.98]"
              >
                Key facts
              </Link>
              <Link
                href="#topic-faq"
                className="shrink-0 snap-start inline-flex min-h-[44px] items-center justify-center rounded-none border border-border px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground bg-background/50 backdrop-blur-sm transition-transform active:scale-[0.98]"
              >
                FAQ
              </Link>
            </div>
          </div>
        </section>

        {topicCollections.collections.length > 0 ? (
          <CollectionRail
            title={`${topic.name} Collections`}
            subtitle="Play curated journeys tied to this topic."
            items={topicCollections.collections}
          />
        ) : null}

        <section className="space-y-8" id="topic-quizzes">
          <ModernFilterBar
            filters={appliedFilters}
            {...filterOptions}
            total={listing.pagination.total}
          />

          <div className="space-y-10">
            {listing.quizzes.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listing.quizzes.map((quiz) => {
                  const gradient = getSportGradient(quiz.sport, hashString(`${quiz.title}`));
                  const durationLabel = quiz.duration ? `${Math.round(quiz.duration / 60)} MIN` : "FLEX";
                  const playersLabel = `${(quiz._count?.attempts || 0).toLocaleString()} PLAYERS`;
                  const difficultyLabel = (quiz.difficulty || "MEDIUM").toString();

                  return (
                    <ShowcaseQuizCard
                      key={quiz.id}
                      id={quiz.id}
                      title={quiz.title}
                      badgeLabel={quiz.sport || quiz.difficulty || "Quiz"}
                      durationLabel={durationLabel}
                      playersLabel={playersLabel}
                      difficultyLabel={difficultyLabel}
                      accent={gradient}
                      coverImageUrl={quiz.descriptionImageUrl}
                      href={`/quizzes/${quiz.slug}`}
                    />
                  );
                })}
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

            {(dedupedHeroFeatured.length > 0 ||
              dedupedTopRated.length > 0 ||
              leaderboards.allTime.length > 0 ||
              Boolean(userStreak)) && (
              <section className="space-y-6" id="topic-social-proof">
                {dedupedHeroFeatured.length > 0 && (
                  <section>
                    <FeaturedTradingCardsCarousel quizzes={dedupedHeroFeatured} embedded />
                  </section>
                )}

                {dedupedTopRated.length > 0 && (
                  <FeaturedTradingCardsCarousel
                    title="Top rated by fans"
                    subtitle="Quizzes the community keeps replaying"
                    quizzes={dedupedTopRated}
                    embedded
                  />
                )}

                <Card className="rounded-none border border-border/60 bg-card/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Top fans (all-time)</CardTitle>
                    <CardDescription>Correct answers in this topic</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {leaderboards.allTime.length > 0 ? (
                      leaderboards.allTime.map((entry) => (
                        <div
                          key={entry.userId}
                          className="flex items-center justify-between rounded-none border border-border/60 bg-background px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-none bg-primary/15 text-xs font-semibold text-primary">
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
                  <Card className="rounded-none border border-border/60 bg-card/80 shadow-sm">
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
              </section>
            )}
          </div>
        </section>

        {showAuthority && publishedSnapshot && (
          <TopicAuthorityContainer className="rounded-none border-border/60 bg-card/80">
            <TopicAuthoritySection
              topicName={topic.name}
              introMd={publishedSnapshot.introMd}
              keyFactsMd={publishedSnapshot.keyFactsMd}
              timelineMd={publishedSnapshot.timelineMd}
              analysisMd={publishedSnapshot.analysisMd}
              faqMd={publishedSnapshot.faqMd}
              sourcesMd={publishedSnapshot.sourcesMd}
              lastReviewedAt={publishedSnapshot.lastReviewedAt}
            />
          </TopicAuthorityContainer>
        )}

        {topic.children.length > 0 && (
          <section className="space-y-6" id="topic-subtopics">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground font-['Barlow_Condensed',sans-serif]">Related topics</h2>
              <p className="text-sm text-muted-foreground">
                Discover more angles connected to {topic.name}.
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-4">
                {topic.children.map((child) => (
                  <Link key={child.id} href={`/topics/${child.slug}`} className="flex-none">
                    <Card className="h-full w-72 overflow-hidden rounded-none border border-border/60 bg-card/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                      <CardHeader className="space-y-2 p-5">
                        <CardTitle className="truncate text-lg uppercase tracking-tight font-['Barlow_Condensed',sans-serif]">{child.name}</CardTitle>
                        <CardDescription className="line-clamp-3 text-sm text-muted-foreground">
                          {sanitizeTopicSnippet(child.description, child.name)}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
        </div>
      </PageContainer>

      <StructuredData id={`topic-graph-${topic.id}`} data={topicGraphSchema} />
      <StructuredData id={`topic-breadcrumb-${topic.id}`} data={breadcrumbSchema} />
      <StructuredData id={`topic-item-list-${topic.id}`} data={itemListSchema} />
      {faqSchema ? <StructuredData id={`topic-faq-${topic.id}`} data={faqSchema} /> : null}
    </main>
  );
}
