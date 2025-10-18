import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateQuizMetaTags } from "@/lib/seo-utils";
import { getQuizSchema, getQuizHowToSchema, getBreadcrumbSchema } from "@/lib/schema-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StartQuizButton } from "./start-quiz-button";
import { ChallengeButton } from "./challenge-button";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewsList } from "@/components/quiz/ReviewsList";
import { AttemptLimitBanner } from "@/components/quiz/AttemptLimitBanner";
import { getAttemptLimitStatus } from "@/lib/services/attempt-limit.service";
import {
  Clock,
  HelpCircle,
  Target,
  Users,
  Calendar,
  Award,
  Zap,
  Play,
  Shield,
  Star,
} from "lucide-react";

interface QuizDetailPageProps {
  params: Promise<{ slug: string }>;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) {
    return "Flexible";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) {
    return `${remainingSeconds} sec`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
}

function formatDateTime(date?: Date | null) {
  if (!date) {
    return "No schedule";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const difficultyConfig = {
  EASY: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: "🟢" },
  MEDIUM: { color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: "🟡" },
  HARD: { color: "bg-rose-500/10 text-rose-600 border-rose-500/30", icon: "🔴" },
};

export async function generateMetadata({
  params,
}: QuizDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      sport: true,
      difficulty: true,
      descriptionImageUrl: true,
      slug: true,
      isPublished: true,
      status: true,
    },
  });

  if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
    return {
      title: "Quiz not found | Sports Trivia",
      description: "The requested quiz could not be found.",
    };
  }

  const meta = generateQuizMetaTags(quiz);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const canonicalUrl = baseUrl ? `${baseUrl}/quizzes/${quiz.slug}` : undefined;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.ogTitle,
      description: meta.ogDescription,
      type: "article",
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      ...(quiz.descriptionImageUrl
        ? { images: [{ url: quiz.descriptionImageUrl }] }
        : {}),
    },
    twitter: {
      card: quiz.descriptionImageUrl ? "summary_large_image" : "summary",
      title: meta.ogTitle,
      description: meta.ogDescription,
      ...(quiz.descriptionImageUrl
        ? { images: [quiz.descriptionImageUrl] }
        : {}),
    },
    ...(canonicalUrl
      ? {
          alternates: {
            canonical: canonicalUrl,
          },
        }
      : {}),
  };
}

export default async function QuizDetailPage({
  params,
}: QuizDetailPageProps) {
  const { slug } = await params;
  // Fetch session first (doesn't use DB connection)
  const session = await auth();
  
  // Then fetch quiz data with all related data in a single optimized query
  const quiz = await prisma.quiz.findUnique({
      where: { slug },
      include: {
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      topicConfigs: {
        select: {
          questionCount: true,
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
        _count: {
          select: {
            questionPool: true,
            attempts: true,
            reviews: true,
          },
        },
      },
  });

  if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
    notFound();
  }

  // Fetch reviews and unique users count in parallel (after quiz is confirmed to exist)
  const [reviews, uniqueUsersCount] = await Promise.all([
    prisma.quizReview.findMany({
      where: { quizId: quiz.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.quizAttempt.groupBy({
      by: ['userId'],
      where: { quizId: quiz.id },
      _count: true,
    }).then(results => results.length),
  ]);

  const isLoggedIn = Boolean(session?.user);
  const now = new Date();

  const userId = session?.user?.id ?? null;
  const attemptLimitStatus = userId && quiz.maxAttemptsPerUser
    ? await getAttemptLimitStatus(prisma, {
        userId,
        quiz: {
          id: quiz.id,
          maxAttemptsPerUser: quiz.maxAttemptsPerUser,
          attemptResetPeriod: quiz.attemptResetPeriod,
        },
        referenceDate: now,
      })
    : null;

  const attemptLimitDetails = quiz.maxAttemptsPerUser
    ? {
        maxAttempts: quiz.maxAttemptsPerUser,
        period: quiz.attemptResetPeriod,
        attemptsRemaining: isLoggedIn
          ? attemptLimitStatus?.remainingBeforeStart ?? quiz.maxAttemptsPerUser
          : null,
        attemptsUsed: isLoggedIn ? attemptLimitStatus?.used ?? 0 : null,
        resetAt: attemptLimitStatus?.resetAt
          ? attemptLimitStatus.resetAt.toISOString()
          : null,
        isLocked: isLoggedIn ? attemptLimitStatus?.isLimitReached ?? false : false,
      }
    : null;
  const hasStarted = !quiz.startTime || quiz.startTime <= now;
  const hasEnded = Boolean(quiz.endTime && quiz.endTime < now);
  const isLive = hasStarted && !hasEnded;

  let availabilityStatus: "upcoming" | "live" | "ended" = "live";
  let availabilityMessage = "This quiz is live and ready to play.";

  if (hasEnded) {
    availabilityStatus = "ended";
    availabilityMessage = `This quiz ended on ${formatDateTime(quiz.endTime)}.`;
  } else if (!hasStarted) {
    availabilityStatus = "upcoming";
    availabilityMessage = `This quiz will be available on ${formatDateTime(quiz.startTime)}.`;
  }

  const tags = quiz.tags.map((relation) => relation.tag);
  // Deduplicate topics (multiple configs can reference same topic with different difficulties)
  const topicsMap = new Map(
    quiz.topicConfigs.map((config) => [config.topic.id, config.topic])
  );
  const topics = Array.from(topicsMap.values());

  // Calculate actual number of questions user will answer
  let actualQuestionCount = quiz._count.questionPool;
  
  if (quiz.questionSelectionMode === "TOPIC_RANDOM") {
    // Sum up questionCount from all topic configs
    actualQuestionCount = quiz.topicConfigs.reduce((sum, config) => sum + config.questionCount, 0);
  } else if (quiz.questionSelectionMode === "POOL_RANDOM") {
    // Use the specified questionCount
    actualQuestionCount = quiz.questionCount || quiz._count.questionPool;
  }
  // FIXED mode uses _count.questionPool (default from above)

  const difficultyInfo = difficultyConfig[quiz.difficulty as keyof typeof difficultyConfig];

  const limitBlocksPlay = attemptLimitDetails?.isLocked ?? false;
  const startDisabled = !isLive || limitBlocksPlay;
  const challengeDisabled = !isLive || limitBlocksPlay;
  const startButtonText = limitBlocksPlay ? "Attempts Locked" : "Start Quiz";

  // Generate structured data
  const quizSchema = getQuizSchema(quiz);
  const howToSchema = getQuizHowToSchema(quiz);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Quizzes", url: "/quizzes" },
    { name: quiz.title },
  ]);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Image Background */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        {/* Background Image with Overlay */}
        {quiz.descriptionImageUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={quiz.descriptionImageUrl}
              alt={`${quiz.title} background`}
              fill
              className="object-cover opacity-10 blur-sm"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left: Image Card */}
            <div className="lg:col-span-2">
              {quiz.descriptionImageUrl ? (
                <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl transition-transform hover:scale-[1.02]">
                  <div className="aspect-[4/3] w-full">
                    <Image
                      src={quiz.descriptionImageUrl}
                      alt={quiz.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      priority
                    />
                  </div>
                  {/* Featured Badge */}
                  {quiz.isFeatured && (
                    <div className="absolute left-4 top-4">
                      <Badge className="bg-primary px-3 py-1 text-sm font-semibold shadow-lg">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  {/* Stats Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-6">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {quiz._count.attempts.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">attempts</span>
                      </div>
                      {quiz.totalReviews > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="font-medium text-foreground">
                            {quiz.averageRating.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">
                            ({quiz.totalReviews})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30">
                  <Play className="h-16 w-16 text-muted-foreground/30" />
                </div>
            )}
          </div>

            {/* Right: Quiz Info */}
            <div className="space-y-6 lg:col-span-3">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                {quiz.sport && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {quiz.sport}
                  </Badge>
                )}
                <Badge
                  className={`border px-3 py-1 ${difficultyInfo.color}`}
                >
                  {difficultyInfo.icon} {quiz.difficulty}
                </Badge>
            <Badge
              variant={
                availabilityStatus === "live"
                  ? "default"
                  : availabilityStatus === "upcoming"
                    ? "secondary"
                    : "destructive"
              }
                  className="px-3 py-1"
            >
              {availabilityStatus === "live"
                    ? "● Live now"
                : availabilityStatus === "upcoming"
                  ? "Upcoming"
                  : "Closed"}
            </Badge>
                {topics.map((topic) => (
                  <Link key={topic.id} href={`/topics/${topic.slug}`}>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer px-3 py-1 transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      📚 {topic.name}
                    </Badge>
                  </Link>
                ))}
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="px-3 py-1 capitalize"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>

              {/* Title */}
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
                  {quiz.title}
                </h1>
                {quiz.description && (
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    {quiz.description}
                  </p>
                )}
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Questions</p>
                    <p className="font-bold">{actualQuestionCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-bold text-sm">{formatDuration(quiz.duration)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pass</p>
                    <p className="font-bold">{quiz.passingScore}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Players</p>
                    <p className="font-bold">{uniqueUsersCount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {isLoggedIn ? (
                  <>
                    <StartQuizButton
                      slug={quiz.slug}
                      disabled={startDisabled}
                      text={startButtonText}
                    />
                    <ChallengeButton quizId={quiz.id} disabled={challengeDisabled} />
                  </>
                ) : (
                  <Link href="/auth/signin">
                    <Button size="lg" className="gap-2 shadow-lg">
                      <Play className="h-5 w-5" />
                      Sign up to play
                    </Button>
                  </Link>
                )}
              </div>

              {attemptLimitDetails && (
                <AttemptLimitBanner
                  maxAttempts={attemptLimitDetails.maxAttempts}
                  period={attemptLimitDetails.period}
                  attemptsRemaining={attemptLimitDetails.attemptsRemaining}
                  attemptsUsed={attemptLimitDetails.attemptsUsed}
                  resetAt={attemptLimitDetails.resetAt}
                  requiresLogin={!isLoggedIn}
                  className="mt-4"
                />
              )}

              {/* Availability Message */}
              {availabilityStatus !== "live" && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <Calendar className="mr-2 inline h-4 w-4" />
                    {availabilityMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Features Card */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quiz Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
                    <Shield className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                      <p className="font-medium">Hints Available</p>
                      <p className="text-sm text-muted-foreground">
                        {quiz.showHints
                          ? "Get helpful hints for each question"
                          : "No hints - pure knowledge test"}
                </p>
              </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
                    <Target className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                      <p className="font-medium">Scoring</p>
                      <p className="text-sm text-muted-foreground">
                        {quiz.negativeMarkingEnabled
                          ? `Penalties apply (-${quiz.penaltyPercentage}%)`
                          : "No negative marking"}
                </p>
              </div>
              </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
                    <Clock className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                      <p className="font-medium">Time Bonus</p>
                      <p className="text-sm text-muted-foreground">
                        {quiz.timeBonusEnabled
                          ? `${quiz.bonusPointsPerSecond} pts/sec saved`
                          : "No time bonus"}
                </p>
              </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
                    <HelpCircle className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                      <p className="font-medium">Question Order</p>
                      <p className="text-sm text-muted-foreground">
                        {quiz.randomizeQuestionOrder ? "Randomized" : "Fixed order"}
                      </p>
                    </div>
                  </div>
              </div>
            </CardContent>
          </Card>

            {/* How to Play */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  How to Play
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      1
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Click &ldquo;Start Quiz&rdquo; to begin. You&apos;ll need to answer at least{" "}
                      {quiz.passingScore}% correctly to pass.
                    </p>
                  </li>
                  {quiz.timePerQuestion ? (
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        2
                      </span>
                      <p className="text-sm text-muted-foreground">
                        You have {formatDuration(quiz.timePerQuestion)} for each question.
                        Answer before time runs out!
                      </p>
                  </li>
                ) : (
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        2
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Manage your total time of {formatDuration(quiz.duration)} wisely
                        across all questions.
                      </p>
                    </li>
                  )}
                  {quiz.negativeMarkingEnabled && (
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        3
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Be careful! Wrong answers reduce your score by{" "}
                        {quiz.penaltyPercentage}% of the question value.
                      </p>
                  </li>
                )}
                  {quiz.timeBonusEnabled && (
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {quiz.negativeMarkingEnabled ? 4 : 3}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Answer quickly to earn bonus points! You&apos;ll get{" "}
                        {quiz.bonusPointsPerSecond} points for each second you save.
                      </p>
                  </li>
                  )}
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {quiz.negativeMarkingEnabled && quiz.timeBonusEnabled
                        ? 5
                        : quiz.negativeMarkingEnabled || quiz.timeBonusEnabled
                          ? 4
                          : 3}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Review your results, earn badges, and climb the leaderboard!
                    </p>
                  </li>
                </ol>
            </CardContent>
          </Card>
        </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule Card */}
            {(quiz.startTime || quiz.endTime) && (
          <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Opens</p>
                <p className="font-medium">
                  {quiz.startTime ? formatDateTime(quiz.startTime) : "Available now"}
                </p>
              </div>
                  <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Closes</p>
                <p className="font-medium">
                  {quiz.endTime ? formatDateTime(quiz.endTime) : "No end date"}
                </p>
              </div>
            </CardContent>
          </Card>
            )}

            {/* Community Stats */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Attempts</span>
                  <span className="font-bold">
                    {quiz._count.attempts.toLocaleString()}
                </span>
              </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Rating</span>
                  <span className="font-bold">
                  {quiz.totalReviews > 0
                      ? `${quiz.averageRating.toFixed(1)} ★`
                      : "No ratings"}
                </span>
              </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reviews</span>
                  <span className="font-bold">{quiz._count.reviews}</span>
                </div>
              </CardContent>
            </Card>

            {/* CTA for non-logged in users */}
            {!isLoggedIn && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-3 text-center">
                    <Award className="mx-auto h-12 w-12 text-primary" />
                    <h3 className="font-semibold">Join the Competition</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a free account to save your progress, earn badges, and
                      compete on the leaderboard.
                    </p>
                    <Link href="/auth/signin">
                      <Button className="w-full">Sign Up Free</Button>
                    </Link>
              </div>
            </CardContent>
          </Card>
            )}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4">
        <div className="space-y-6">
          <div>
              <h2 className="text-3xl font-bold tracking-tight">Reviews & Ratings</h2>
            {quiz._count.reviews > 0 ? (
              <div className="mt-4 flex items-center gap-4">
                  <StarRating value={quiz.averageRating} readonly size="lg" showValue />
                <span className="text-sm text-muted-foreground">
                  Based on {quiz._count.reviews}{" "}
                  {quiz._count.reviews === 1 ? "review" : "reviews"}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No reviews yet. Be the first to review this quiz!
              </p>
            )}
          </div>

          <ReviewsList
            quizSlug={quiz.slug}
            quizTitle={quiz.title}
            initialReviews={reviews.map((r) => ({
              ...r,
              createdAt: r.createdAt.toISOString(),
            }))}
            initialTotal={quiz._count.reviews}
            initialPage={1}
            currentUserId={session?.user?.id}
          />
          </div>
        </div>
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </main>
  );
}
