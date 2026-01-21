import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { generateQuizMetaTags } from "@/lib/seo-utils";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { ShowcaseReviewsPanel } from "@/components/showcase/ui";
import { Star, Clock, Trophy, Users, ShieldCheck, Zap, ArrowRight, Calendar, Info, Share2, MessageSquare } from "lucide-react";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAttemptLimitStatus } from "@/lib/services/attempt-limit.service";
import { ArticleJsonLd, AggregateRatingJsonLd } from "next-seo";
import { getCanonicalUrl } from "@/lib/next-seo-config";
import { cn } from "@/lib/utils";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { PageContainer } from "@/components/shared/PageContainer";

interface QuizDetailPageProps {
  params: Promise<{ slug: string }>;
}

const allowedImageHosts = [
  "images.unsplash.com",
  "lh3.googleusercontent.com",
  "api.dicebear.com",
];

function getValidImageUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (parsed.hostname.endsWith(".supabase.co")) return url;
    return allowedImageHosts.includes(parsed.hostname) ? url : null;
  } catch {
    return null;
  }
}

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export const dynamic = 'auto';
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { isPublished: true, status: "PUBLISHED" },
      select: { slug: true, _count: { select: { attempts: true } } },
      take: 1000,
    });
    const topQuizzes = quizzes.sort((a, b) => b._count.attempts - a._count.attempts).slice(0, 100);
    return topQuizzes.map((quiz) => ({ slug: quiz.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: QuizDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { slug },
    select: {
      title: true, description: true, seoTitle: true, seoDescription: true,
      seoKeywords: true, sport: true, difficulty: true, descriptionImageUrl: true,
      slug: true, isPublished: true, status: true,
    },
  });

  if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
    return { title: "Quiz not found", description: "The requested quiz could not be found." };
  }

  const heroImageUrl = getValidImageUrl(quiz.descriptionImageUrl);
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
      ...(heroImageUrl ? { images: [{ url: heroImageUrl }] } : {}),
    },
    twitter: {
      card: heroImageUrl ? "summary_large_image" : "summary",
      title: meta.ogTitle,
      description: meta.ogDescription,
      ...(heroImageUrl ? { images: [heroImageUrl] } : {}),
    },
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
  };
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  let quiz: any;
  let showcaseReviews: any[] = [];
  let uniqueUsersCount: number = 0;

  try {
    quiz = await prisma.quiz.findUnique({
      where: { slug },
      select: {
        id: true, title: true, description: true, slug: true,
        sport: true, difficulty: true, duration: true, timePerQuestion: true,
        descriptionImageUrl: true, createdAt: true, updatedAt: true,
        averageRating: true, totalReviews: true, maxAttemptsPerUser: true,
        attemptResetPeriod: true, recurringType: true, isPublished: true,
        status: true,
        _count: { select: { attempts: true, reviews: true } },
        leaderboard: {
          take: 3,
          orderBy: [{ bestScore: "desc" }, { averageResponseTime: "asc" }],
          include: { user: { select: { name: true, email: true, image: true } } },
        },
        topicConfigs: {
          include: { topic: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
      notFound();
    }

    const distinctUsers = await prisma.quizAttempt.findMany({
      where: { quizId: quiz.id },
      distinct: ["userId"],
      select: { userId: true },
    });
    uniqueUsersCount = distinctUsers.length;

    const rawReviews = await prisma.quizReview.findMany({
      where: { quizId: quiz.id },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    showcaseReviews = (rawReviews || []).map((r) => ({
      id: r.id,
      reviewer: { name: r.user?.name || "Anonymous", avatarUrl: r.user?.image },
      rating: r.rating,
      quote: r.comment ?? "",
      dateLabel: r.createdAt.toLocaleDateString(),
    }));
  } catch (error) {
    console.error("Error fetching quiz:", error);
    notFound();
  }

  const heroImageUrl = getValidImageUrl(quiz.descriptionImageUrl);
  const topicConfigs = ensureArray(quiz.topicConfigs);
  const leaderboardRecords = ensureArray(quiz.leaderboard);
  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  const playersLabel = formatPlayerCount(uniqueUsersCount);
  const badgeLabel = (topicConfigs[0] as any)?.topic?.name ?? quiz.sport ?? quiz.difficulty ?? "Arena";

  const now = new Date();
  const hasAttemptLimit = quiz.maxAttemptsPerUser != null;
  const attemptLimitStatus = user && hasAttemptLimit
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

  const maxAttempts = quiz.maxAttemptsPerUser ?? null;
  const remainingAttempts = attemptLimitStatus?.remainingBeforeStart ?? maxAttempts;
  const isLimitReached = attemptLimitStatus?.isLimitReached ?? (hasAttemptLimit && (remainingAttempts ?? 0) <= 0);
  const resetAt = attemptLimitStatus?.resetAt;
  const attemptProgressPercent = maxAttempts !== null && maxAttempts > 0
    ? Math.max(0, Math.min(100, ((remainingAttempts ?? 0) / maxAttempts) * 100))
    : 0;

  let bestAttemptId: string | null = null;
  if (isLimitReached && user) {
    const bestAttempt = await prisma.quizAttempt.findFirst({
      where: { userId: user.id, quizId: quiz.id, completedAt: { not: null }, isPracticeMode: false },
      orderBy: [{ totalPoints: "desc" }, { score: "desc" }, { completedAt: "desc" }],
      select: { id: true },
    });
    bestAttemptId = bestAttempt?.id ?? null;
  }

  let sidebarLeaderboard: any[] = [];
  if (quiz.recurringType === "DAILY" || quiz.recurringType === "WEEKLY") {
    const isDaily = quiz.recurringType === "DAILY";
    const rows = await prisma.$queryRaw<any[]>(
      isDaily
        ? Prisma.sql`
            WITH per_period_best AS (
              SELECT
                "userId",
                date_trunc('day', "completedAt") AS period_start,
                MAX("totalPoints") AS best_points,
                AVG(COALESCE("averageResponseTime", 0)) AS avg_response
              FROM "QuizAttempt"
              WHERE "quizId" = ${quiz.id}
                AND "isPracticeMode" = false
                AND "completedAt" IS NOT NULL
              GROUP BY "userId", date_trunc('day', "completedAt")
            ),
            aggregated AS (
              SELECT
                "userId",
                SUM(best_points) AS sum_points,
                AVG(avg_response) AS avg_response
              FROM per_period_best
              GROUP BY "userId"
            )
            SELECT a."userId", a.sum_points::int AS "bestPoints", a.avg_response, u.name, u.email
            FROM aggregated a
            JOIN "User" u ON u.id = a."userId"
            ORDER BY a.sum_points DESC, a.avg_response ASC
            LIMIT 5
          `
        : Prisma.sql`
            WITH per_period_best AS (
              SELECT
                "userId",
                date_trunc('week', "completedAt") AS period_start,
                MAX("totalPoints") AS best_points,
                AVG(COALESCE("averageResponseTime", 0)) AS avg_response
              FROM "QuizAttempt"
              WHERE "quizId" = ${quiz.id}
                AND "isPracticeMode" = false
                AND "completedAt" IS NOT NULL
              GROUP BY "userId", date_trunc('week', "completedAt")
            ),
            aggregated AS (
              SELECT
                "userId",
                SUM(best_points) AS sum_points,
                AVG(avg_response) AS avg_response
              FROM per_period_best
              GROUP BY "userId"
            )
            SELECT a."userId", a.sum_points::int AS "bestPoints", a.avg_response, u.name, u.email
            FROM aggregated a
            JOIN "User" u ON u.id = a."userId"
            ORDER BY a.sum_points DESC, a.avg_response ASC
            LIMIT 5
          `
    );
    sidebarLeaderboard = (rows || []).map((r, index) => ({
      name: r.name || r.email?.split("@")[0] || `Player ${index + 1}`,
      score: r.bestPoints || 0,
      rank: index + 1,
    }));
  } else {
    sidebarLeaderboard = leaderboardRecords.map((entry: any, index: number) => ({
      name: entry.user?.name || entry.user?.email?.split("@")[0] || `Player ${index + 1}`,
      score: Math.round(entry.bestScore || entry.bestPoints || 0),
      rank: entry.rank && entry.rank < 999999 ? entry.rank : index + 1,
    }));
  }

  const averageRating = typeof quiz.averageRating === "number" ? quiz.averageRating : 0;
  const totalReviews = typeof quiz.totalReviews === "number" ? quiz.totalReviews : quiz._count?.reviews ?? 0;
  const quizUrl = getCanonicalUrl(`/quizzes/${quiz.slug}`) || `/quizzes/${quiz.slug}`;
  const articleImages = heroImageUrl ? [heroImageUrl] : [];
  const { circle1, circle2, circle3 } = getBlurCircles();

  return (
    <ShowcaseThemeProvider>
      <ArticleJsonLd
        url={quizUrl}
        headline={quiz.title}
        images={articleImages}
        datePublished={quiz.createdAt?.toISOString() || ""}
        dateModified={quiz.updatedAt?.toISOString() || ""}
        authorName="Sports Trivia Team"
        publisherName="Sports Trivia"
        publisherLogo={getCanonicalUrl("/logo.png") || ""}
        description={quiz.description || ""}
      />
      {totalReviews > 0 && averageRating > 0 && (
        <AggregateRatingJsonLd
          itemReviewed={{
            "@type": "Product",
            name: quiz.title,
            url: quizUrl
          }}
          ratingValue={averageRating}
          reviewCount={totalReviews}
          bestRating={5}
          worstRating={1}
        />
      )}

      <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20">
        <div className="absolute inset-0 -z-10">
          {circle1}
          {circle2}
          {circle3}
        </div>

        <PageContainer>
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

            {/* Main Content Area */}
            <div className="flex-1 space-y-12">

              {/* Header Card */}
              <div className="relative group">
                {/* Hero Image for Mobile */}
                {heroImageUrl && (
                  <div className="relative mb-8 w-full aspect-video overflow-hidden rounded-[2.5rem] lg:hidden p-[1px] bg-white/10">
                    <div className="h-full w-full rounded-[2.4rem] overflow-hidden relative">
                      <Image src={heroImageUrl} alt={quiz.title} fill className="object-cover" priority />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary shadow-neon-cyan/20">
                      {badgeLabel}
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-xs font-black tracking-widest">{averageRating.toFixed(1)}</span>
                      <span className="text-[10px] font-bold text-muted-foreground ml-1">({totalReviews}) LOGS</span>
                    </div>
                  </div>

                  <h1 className={cn(
                    "text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9]",
                    getGradientText("neon")
                  )}>
                    {quiz.title}
                  </h1>

                  <p className="max-w-2xl text-lg text-muted-foreground font-medium leading-relaxed">
                    {quiz.description || "Blitz through fresh trivia curated for diehard fans. Battle against the clock and climb your league leaderboard."}
                  </p>

                  <div className="pt-4 flex flex-wrap gap-4">
                    <div className="flex flex-col gap-1 p-6 rounded-[2rem] glass-elevated border border-white/5 min-w-[140px]">
                      <Clock className="h-5 w-5 text-secondary mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Time</p>
                      <p className="text-2xl font-black tracking-tighter">{durationLabel}</p>
                    </div>
                    <div className="flex flex-col gap-1 p-6 rounded-[2rem] glass-elevated border border-white/5 min-w-[140px]">
                      <ShieldCheck className="h-5 w-5 text-primary mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tier</p>
                      <p className="text-2xl font-black tracking-tighter uppercase">{quiz.difficulty}</p>
                    </div>
                    <div className="flex flex-col gap-1 p-6 rounded-[2rem] glass-elevated border border-white/5 min-w-[140px]">
                      <Users className="h-5 w-5 text-accent mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Contenders</p>
                      <p className="text-2xl font-black tracking-tighter">{playersLabel}</p>
                    </div>
                  </div>

                  <div className="pt-8 flex flex-wrap gap-4">
                    {isLimitReached && bestAttemptId ? (
                      <Link href={`/quizzes/${quiz.slug}/results/${bestAttemptId}`} className="w-full sm:w-auto">
                        <ShowcaseButton variant="neon" size="xl" className="w-full">VIEW MISSION REPORT</ShowcaseButton>
                      </Link>
                    ) : isLimitReached ? (
                      <ShowcaseButton variant="glass" size="xl" className="w-full sm:w-auto cursor-not-allowed opacity-50" disabled>LOCKED: LIMIT REACHED</ShowcaseButton>
                    ) : (
                      <Link href={`/quizzes/${quiz.slug}/play`} className="w-full sm:w-auto">
                        <ShowcaseButton variant="neon" size="xl" className="w-full group">
                          INITIALIZE MISSION
                          <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                        </ShowcaseButton>
                      </Link>
                    )}
                    <ShowcaseButton variant="glass" size="xl" className="w-full sm:w-auto">
                      <Share2 className="mr-3 h-5 w-5" />
                      SHARE
                    </ShowcaseButton>
                  </div>
                </div>
              </div>

              {/* Transmission Feed (Reviews) */}
              <div className="pt-12">
                <ShowcaseReviewsPanel reviews={showcaseReviews} className="bg-transparent" />
              </div>
            </div>

            {/* Sidebar Controls */}
            <aside className="w-full lg:w-[400px] space-y-8">

              {/* Desktop Hero Image Container */}
              {heroImageUrl && (
                <div className="relative hidden lg:block aspect-square overflow-hidden rounded-[3rem] p-[2px] bg-gradient-to-br from-white/20 to-transparent shadow-glass-lg">
                  <div className="h-full w-full rounded-[2.9rem] overflow-hidden relative">
                    <Image src={heroImageUrl} alt={quiz.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                  </div>
                </div>
              )}

              {/* Attempt Status Card */}
              <div className="rounded-[2.5rem] p-8 glass-elevated border border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-secondary" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Deployment Status</h3>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-neon-lime" />
                </div>

                {maxAttempts !== null ? (
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Attempts Available</p>
                        <p className="text-4xl font-black">{remainingAttempts}</p>
                      </div>
                      <p className="text-xl font-black text-muted-foreground/20">/ {maxAttempts}</p>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-700 shadow-neon-cyan",
                          isLimitReached ? "bg-red-500" : "bg-primary"
                        )}
                        style={{ width: `${attemptProgressPercent}%` }}
                      />
                    </div>
                    {resetAt && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RESETS: {new Date(resetAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">INFINITE ACCESS ENABLED</p>
                    <div className="text-4xl font-black tracking-tighter">UNLIMITED</div>
                  </div>
                )}
              </div>

              {/* Sidebar Leaderboard */}
              <div className="rounded-[2.5rem] p-8 glass-elevated border border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Sector Leaders</h3>
                  </div>
                  <Link href="/leaderboard" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">FULL LOGS</Link>
                </div>

                <div className="space-y-3">
                  {sidebarLeaderboard.map((player, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl glass border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg glass border border-white/5 flex items-center justify-center text-[10px] font-black text-muted-foreground">#{idx + 1}</div>
                        <p className="text-xs font-black uppercase truncate max-w-[120px]">{player.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black tracking-widest text-primary">{player.score.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">PTS</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Info / Security */}
              <div className="flex items-center gap-4 p-6 rounded-[2rem] border border-white/5 text-muted-foreground">
                <Info className="h-5 w-5 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  Secure Arena Environment. All attempts are verified for fair play and competitive integrity.
                </p>
              </div>
            </aside>
          </div>
        </PageContainer>
      </main>
    </ShowcaseThemeProvider>
  );
}
