import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma, QuizStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getTopicIdsWithDescendants } from "@/lib/services/topic.service";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Layers,
  Star,
} from "lucide-react";

const topicWithRelations = {
  include: {
    parent: {
      select: {
        id: true,
        name: true,
        slug: true,
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

type TopicWithRelations = Prisma.TopicGetPayload<typeof topicWithRelations>;

const quizSummarySelection = {
  select: {
    id: true,
    title: true,
    slug: true,
    description: true,
    descriptionImageUrl: true,
    sport: true,
    difficulty: true,
    duration: true,
    averageRating: true,
    totalReviews: true,
    createdAt: true,
    _count: {
      select: {
        attempts: true,
        questionPool: true,
      },
    },
  },
} satisfies Prisma.QuizDefaultArgs;

type QuizSummary = Prisma.QuizGetPayload<typeof quizSummarySelection>;

const fetchTopicBySlug = cache(async (slug: string) => {
  const topic = await prisma.topic.findUnique({
    where: { slug },
    ...topicWithRelations,
  });

  return topic;
});

async function fetchRelatedQuizzes(topicId: string): Promise<QuizSummary[]> {
  const topicIds = await getTopicIdsWithDescendants(topicId);

  return prisma.quiz.findMany({
    where: {
      isPublished: true,
      status: QuizStatus.PUBLISHED,
      OR: [
        // Quizzes configured with this topic
        {
          topicConfigs: {
            some: {
              topicId: {
                in: topicIds,
              },
            },
          },
        },
        // Quizzes that have questions from this topic
        {
          questionPool: {
            some: {
              question: {
                topicId: {
                  in: topicIds,
                },
              },
            },
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    ...quizSummarySelection,
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) {
    return "Under 1 min";
  }
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

function getMetaDescription(topic: TopicWithRelations): string {
  if (topic.description) {
    return topic.description.length > 160
      ? `${topic.description.slice(0, 157)}...`
      : topic.description;
  }

  return `Explore trivia quizzes, key facts, and sub-topics for ${topic.name} on Sports Trivia.`;
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

  const title = `${topic.name} Trivia Quizzes & Sub-topics | Sports Trivia`;
  const description = getMetaDescription(topic);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://sportstrivia.example.com/topics/${topic.slug}`,
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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await fetchTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  const quizzes = await fetchRelatedQuizzes(topic.id);
  const durationFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <section className="space-y-6">
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

          <div className="space-y-4">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
              Level {topic.level}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {topic.name}
            </h1>
            <p className="max-w-3xl text-lg text-muted-foreground">
              {topic.description ||
                `Discover quizzes, stats, and related topics for ${topic.name}.`}
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                  <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
                  Sub-topics
                </div>
                <div className="mt-2 text-2xl font-semibold text-foreground">
                  {topic.children.length}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                  <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                  Questions
                </div>
                <div className="mt-2 text-2xl font-semibold text-foreground">
                  {topic._count.questions}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                  <Star className="h-5 w-5 text-primary" aria-hidden="true" />
                  Related quizzes
                </div>
                <div className="mt-2 text-2xl font-semibold text-foreground">
                  {quizzes.length}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Sub-topics</h2>
              <p className="text-sm text-muted-foreground">
                Explore the immediate sub-topics branching from {topic.name}.
              </p>
            </div>
          </div>

          {topic.children.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {topic.children.map((child) => (
                <Link key={child.id} href={`/topics/${child.slug}`}>
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-xl font-semibold">
                          {child.name}
                        </CardTitle>
                        <Badge variant="outline">Level {child.level}</Badge>
                      </div>
                      <CardDescription>
                        {child.description ||
                          `Dive deeper into ${child.name} trivia challenges.`}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between border-t bg-muted/30 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        {child._count.questions} questions
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" aria-hidden="true" />
                        {child._count.children} sub-topics
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No sub-topics yet. Check back soon for more ways to explore {" "}
                {topic.name}.
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Quizzes related to {topic.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Featured trivia challenges that include this topic in their question
                pools.
              </p>
            </div>
          </div>

          {quizzes.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id} className="flex h-full flex-col overflow-hidden border bg-card">
                    {quiz.descriptionImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={quiz.descriptionImageUrl}
                        alt={`${quiz.title} preview image`}
                        className="h-44 w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <CardHeader className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {quiz.sport ? (
                          <Badge variant="secondary" className="uppercase tracking-wide">
                            {quiz.sport}
                          </Badge>
                        ) : null}
                        <Badge variant="outline">{quiz.difficulty}</Badge>
                      </div>
                      <CardTitle className="text-2xl font-semibold">
                        {quiz.title}
                      </CardTitle>
                      <CardDescription>
                        {quiz.description ||
                          `Test your knowledge with this ${quiz.difficulty.toLowerCase()} difficulty quiz.`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-4 text-sm text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-4">
                        {quiz.duration ? (
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            {formatDuration(quiz.duration)}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" aria-hidden="true" />
                          {quiz._count.questionPool} questions
                        </span>
                        <span className="flex items-center gap-2">
                          <Star className="h-4 w-4" aria-hidden="true" />
                          {(quiz.averageRating ?? 0).toFixed(1)} (
                          {quiz.totalReviews ?? 0} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        Updated {durationFormatter.format(quiz.createdAt)}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/40 py-4">
                      <Link
                        href={`/quizzes/${quiz.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        View quiz details
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No published quizzes include {topic.name} yet. Follow this topic for
                upcoming challenges.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}

