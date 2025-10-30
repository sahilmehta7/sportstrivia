import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateQuizMetaTags } from "@/lib/seo-utils";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";
import { Button } from "@/components/ui/button";
import { ShowcaseReviewsPanel } from "@/components/showcase/ui";
import { Star } from "lucide-react";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAttemptLimitStatus } from "@/lib/services/attempt-limit.service";

interface QuizDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: QuizDetailPageProps): Promise<Metadata> {
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
      ...(quiz.descriptionImageUrl ? { images: [{ url: quiz.descriptionImageUrl }] } : {}),
    },
    twitter: {
      card: quiz.descriptionImageUrl ? "summary_large_image" : "summary",
      title: meta.ogTitle,
      description: meta.ogDescription,
      ...(quiz.descriptionImageUrl ? { images: [quiz.descriptionImageUrl] } : {}),
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

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  let quiz: any;
  let showcaseReviews: Array<{ id: string; reviewer: { name: string; avatarUrl?: string | null; role?: string }; rating: number; quote: string; dateLabel?: string } > = [];
  let uniqueUsersCount: number = 0;

  try {
    quiz = await prisma.quiz.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            attempts: true,
            reviews: true,
          },
        },
        leaderboard: {
          take: 3,
          orderBy: [
            {
              bestScore: "desc",
            },
            {
              averageResponseTime: "asc",
            },
          ],
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        topicConfigs: {
          include: {
            topic: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
    });

    if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
      notFound();
    }
    // Unique players count (distinct users who have played this quiz)
    uniqueUsersCount = await prisma.quizAttempt
      .groupBy({
        by: ["userId"],
        where: { quizId: quiz.id },
        _count: { userId: true },
      })
      .then((groups) => groups.length);
    // Fetch latest reviews for this quiz for the showcase panel
    const rawReviews = await prisma.quizReview.findMany({
      where: { quizId: quiz.id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    showcaseReviews = rawReviews.map((r) => ({
      id: r.id,
      reviewer: { name: r.user?.name || "Anonymous", avatarUrl: r.user?.image },
      rating: r.rating,
      quote: r.comment ?? "",
      dateLabel: r.createdAt.toLocaleDateString(),
    }));
  } catch (error) {
    console.warn(`[quizzes/${slug}] Using fallback data`, error);
    quiz = {
      id: "demo-quiz",
      title: "Ultimate Cricket Venue Challenge",
      description: "An immersive sprint through global cricket arenas.",
      descriptionImageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
      slug,
      sport: "Cricket",
      difficulty: "MEDIUM",
      duration: 1200,
      timePerQuestion: 60,
      timeBonusEnabled: true,
      bonusPointsPerSecond: 1.2,
      maxAttemptsPerUser: 3,
      attemptResetPeriod: "DAILY",
      isPublished: true,
      status: "PUBLISHED",
      averageRating: 4.3,
      totalReviews: 128,
      _count: { attempts: 12345, reviews: 128 },
      topicConfigs: [{ topic: { name: "Cricket" } }],
      leaderboard: [
        { user: { name: "Alex Johnson", email: "alex@example.com" }, bestScore: 96.0, bestPoints: 9600, rank: 1 },
        { user: { name: "Priya Singh", email: "priya@example.com" }, bestScore: 93.2, bestPoints: 9320, rank: 2 },
        { user: { name: "Diego Morales", email: "diego@example.com" }, bestScore: 92.1, bestPoints: 9210, rank: 3 },
      ],
    };
  }

  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  const playersLabel = formatPlayerCount(uniqueUsersCount);
  const badgeLabel =
    quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? quiz.difficulty ?? "Featured";

  // Calculate user's actual attempt limit status
  const now = new Date();
  const attemptLimitStatus = user && quiz.maxAttemptsPerUser
    ? await getAttemptLimitStatus(prisma, {
        userId: user.id,
        quiz: {
          id: quiz.id,
          maxAttemptsPerUser: quiz.maxAttemptsPerUser,
          attemptResetPeriod: quiz.attemptResetPeriod,
        },
        referenceDate: now,
      })
    : null;

  const maxAttempts = quiz.maxAttemptsPerUser || null;
  const remainingAttempts = attemptLimitStatus?.remainingBeforeStart ?? maxAttempts;
  const isLimitReached = attemptLimitStatus?.isLimitReached ?? false;
  const resetAt = attemptLimitStatus?.resetAt;

  // Fetch user's best completed attempt if limit is reached
  let bestAttemptId: string | null = null;
  if (isLimitReached && user) {
    const bestAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: user.id,
        quizId: quiz.id,
        completedAt: { not: null },
        isPracticeMode: false,
      },
      orderBy: [
        { score: "desc" },
        { completedAt: "desc" },
      ],
      select: {
        id: true,
      },
    });
    bestAttemptId = bestAttempt?.id ?? null;
  }

  const leaderboardEntries = (quiz.leaderboard ?? []).map((entry: any, index: number) => ({
    name:
      entry.user?.name ||
      entry.user?.email?.split("@")[0] ||
      `Player ${index + 1}`,
    score: Math.round(entry.bestScore || entry.bestPoints || 0),
    rank: entry.rank && entry.rank < 999999 ? entry.rank : index + 1,
  }));

  const highlightedTitle = quiz.title.split(" ");
  const firstWord = highlightedTitle.shift() ?? quiz.title;
  const remainderTitle = highlightedTitle.join(" ");

  const averageRating =
    typeof quiz.averageRating === "number"
      ? quiz.averageRating
      : typeof quiz.avgRating === "number"
        ? quiz.avgRating
        : 0;

  const totalReviews =
    typeof quiz.totalReviews === "number"
      ? quiz.totalReviews
      : quiz._count?.reviews ?? 0;

  return (
    <ShowcaseThemeProvider>
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 px-4 py-12 dark:from-slate-900 dark:via-purple-900 dark:to-amber-500 sm:px-6 lg:py-16">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-[120px] dark:bg-emerald-400/40" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/20 blur-[100px] dark:bg-pink-500/40" />
        <div className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/15 blur-[90px] dark:bg-blue-500/30" />
      </div>

      <div className="relative w-full max-w-5xl rounded-[1.75rem] border border-slate-200/60 bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-50/80 p-6 shadow-[0_40px_120px_-40px_rgba(59,130,246,0.15)] backdrop-blur-xl dark:border-white/10 dark:from-black/70 dark:via-slate-900/60 dark:to-indigo-900/80 dark:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] sm:p-8 lg:p-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch">
          <div className="flex-1 text-center lg:text-left">
            {quiz.descriptionImageUrl && (
              <div className="relative mb-4 w-full overflow-hidden rounded-2xl lg:hidden h-48">
                <Image
                  src={quiz.descriptionImageUrl}
                  alt={quiz.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent dark:from-black/30" />
              </div>
            )}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/40 bg-white/60 px-4 py-1 text-xs uppercase tracking-[0.35em] text-slate-600 dark:border-white/20 dark:bg-white/10 dark:text-white/70">
              {badgeLabel.toUpperCase()}
            </div>

            <h1 className="mt-6 text-4xl font-black uppercase tracking-tight text-slate-900 drop-shadow-[0_16px_32px_rgba(32,32,48,0.15)] dark:text-white sm:text-5xl lg:text-6xl">
              {firstWord}
              {remainderTitle && <span className="text-emerald-600 dark:text-emerald-300"> {remainderTitle}</span>}
            </h1>

            <p className="mt-4 mx-auto max-w-2xl text-xs text-slate-700 dark:text-white/75 sm:text-sm lg:mx-0">
              {quiz.description
                ? quiz.description
                : "Blitz through fresh trivia curated for diehard fans. Battle against the clock and climb your league leaderboard."}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-600 dark:text-white/50">Time</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{durationLabel}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-600 dark:text-white/50">Difficulty</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <span
                        key={index}
                        className={
                          index < (quiz.difficulty === "HARD" ? 3 : quiz.difficulty === "MEDIUM" ? 2 : 1)
                            ? "opacity-100"
                            : "opacity-30"
                        }
                      >
                        🏆
                      </span>
                    ))}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-600 dark:text-white/50">Players</p>
                <p className="text-3xl font-semibold text-emerald-600 dark:text-emerald-300">{playersLabel}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start">
              <div className="flex -space-x-2 sm:-space-x-3">
                {[getSportGradient(quiz.sport, 0), getSportGradient(quiz.sport, 1), getSportGradient(quiz.sport, 2)].map((gradient, index) => (
                  <div
                    key={`${gradient}-${index}`}
                    className={`relative h-8 w-8 rounded-full border-2 border-slate-300/60 bg-gradient-to-br dark:border-white/30 sm:h-9 sm:w-9 lg:h-10 lg:w-10 ${gradient}`}
                  >
                    <div className="absolute inset-0 rounded-full bg-black/10 dark:bg-black/20" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="text-xs text-slate-700 dark:text-white/70">
                  Join <span className="font-semibold text-slate-900 dark:text-white">{playersLabel}</span> players competing
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-amber-500 dark:text-amber-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${index < Math.round(averageRating) ? "fill-current" : "opacity-30"}`}
                        fill={index < Math.round(averageRating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-800 dark:text-white/80">
                    {averageRating.toFixed(1)} ({totalReviews})
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {isLimitReached && bestAttemptId ? (
                <Button 
                  asChild 
                  className="rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
                >
                  <Link href={`/quizzes/${quiz.slug}/results/${bestAttemptId}`}>
                    View Results
                  </Link>
                </Button>
              ) : (
                <Button 
                  asChild 
                  className="rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
                  disabled={isLimitReached}
                >
                  <Link href={`/quizzes/${quiz.slug}/play`}>
                    {isLimitReached ? "Attempt Limit Reached" : "Start Quiz"}
                  </Link>
                </Button>
              )}
            </div>

            <div className="mt-3 lg:hidden">
              <div className="rounded-xl bg-gradient-to-r from-fuchsia-500/20 via-amber-400/25 to-emerald-400/25 p-[1px]">
                <div className="rounded-xl bg-white/80 p-3 dark:bg-slate-900/80">
                  {maxAttempts ? (
                    <>
                      <p className="mb-2 text-center text-[10px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/60">
                        Attempts Remaining
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-2 overflow-hidden rounded-full bg-slate-300/50 dark:bg-white/10">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isLimitReached 
                                  ? "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500"
                                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500"
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, (remainingAttempts ?? 0) / (maxAttempts ?? 1) * 100))}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-black ${isLimitReached ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                            {remainingAttempts ?? 0}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/60">
                            {maxAttempts ? `of ${maxAttempts}` : "Max"}
                          </p>
                        </div>
                      </div>
                      {isLimitReached && resetAt && (
                        <p className="mt-2 text-center text-[10px] text-slate-600 dark:text-white/60">
                          Resets {new Date(resetAt).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/60">
                        Unlimited Attempts
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">∞</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex w-full max-w-md flex-col items-stretch gap-6 rounded-[1.75rem] border border-slate-200/60 bg-white/80 p-6 text-slate-900 shadow-[0_40px_80px_-40px_rgba(59,130,246,0.15)] backdrop-blur-3xl dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_40px_80px_-40px_rgba(15,15,35,0.7)] sm:p-8 lg:max-w-sm">
            {quiz.descriptionImageUrl && (
              <div className="relative hidden w-full overflow-hidden rounded-2xl lg:block h-48">
                <Image 
                  src={quiz.descriptionImageUrl} 
                  alt={quiz.title}
                  fill
                  sizes="(max-width: 1200px) 100vw, 600px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent dark:from-black/40" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.35em] text-slate-600 dark:text-white/50">Leaderboard</span>
              <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs text-slate-700 dark:bg-white/10 dark:text-white/70">Live</span>
            </div>

            <div className="space-y-4 text-sm">
              {(leaderboardEntries.length ? leaderboardEntries : [
                { name: "Be the first", score: 0, rank: "" },
              ]).map((player: any, index: number) => (
                <div
                  key={`${player.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{player.name}</p>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-600 dark:text-white/40">Score</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{player.score}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-300">{player.rank ? `#${player.rank}` : "Join"}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto hidden rounded-2xl bg-gradient-to-r from-fuchsia-500/20 via-amber-400/30 to-emerald-400/30 p-[1px] dark:from-fuchsia-500/30 dark:via-amber-400/40 dark:to-emerald-400/40 lg:block">
              <div className="rounded-2xl bg-white/70 p-6 dark:bg-slate-900/80">
                {maxAttempts ? (
                  <>
                    <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-white/50">
                      Attempts Remaining
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-300/40 dark:bg-white/10">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isLimitReached 
                                ? "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500"
                                : "bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500"
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, (remainingAttempts ?? 0) / (maxAttempts ?? 1) * 100))}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-black ${isLimitReached ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                          {remainingAttempts ?? 0}
                        </p>
                        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-600 dark:text-white/50">
                          of {maxAttempts}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-center text-xs text-slate-700 dark:text-white/60">
                      {isLimitReached && resetAt
                        ? `Resets ${new Date(resetAt).toLocaleDateString()}`
                        : quiz.attemptResetPeriod === "NEVER" 
                          ? "Limit applies forever"
                          : `Resets ${quiz.attemptResetPeriod?.toLowerCase() || "daily"}`}
                    </p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-white/50">
                      Unlimited Attempts
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">∞</p>
                    <p className="mt-3 text-xs text-slate-700 dark:text-white/60">
                      Take the quiz as many times as you want
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Removed ratings/breakdown blocks from sidebar per design */}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-6 w-full max-w-5xl rounded-[1.75rem] bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-50/80 p-4 text-slate-900 shadow-[0_40px_120px_-40px_rgba(59,130,246,0.15)] backdrop-blur-xl dark:from-black/70 dark:via-slate-900/60 dark:to-indigo-900/80 dark:text-white sm:p-5 lg:p-6">
        <ShowcaseReviewsPanel reviews={showcaseReviews} className="bg-transparent border-0 p-0" />
      </div>
    </div>
    </ShowcaseThemeProvider>
  );
}
