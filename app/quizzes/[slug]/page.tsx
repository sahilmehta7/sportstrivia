import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateQuizMetaTags } from "@/lib/seo-utils";
import { formatPlayerCount, formatQuizDuration } from "@/lib/quiz-formatters";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { Star, Clock, Trophy, Users, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAttemptLimitStatus } from "@/lib/services/attempt-limit.service";
import { JsonLdScript } from "next-seo";
import { getCanonicalUrl } from "@/lib/next-seo-config";
import { cn } from "@/lib/utils";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { PageContainer } from "@/components/shared/PageContainer";
import { ShareQuizButton } from "./share-quiz-button";
import { QuizCommentsSection } from "./QuizCommentsSection";
import { getCachedQuiz, getCachedQuizStats, getCachedLeaderboard } from "@/lib/quiz-cache";
import { getQuizSchema } from "@/lib/schema-utils";

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

// Revalidate page execution every 5 minutes, though inner data has its own cache controls
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

  // Use cached fetcher
  const quiz = await getCachedQuiz(slug);

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
      type: "website",
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

  // 1. Fetch the main quiz definition (Cached)
  const quiz = await getCachedQuiz(slug);
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  if (!quiz || (!isAdmin && (!quiz.isPublished || quiz.status !== "PUBLISHED"))) {
    notFound();
  }

  // 2. Parallelize all secondary data fetching
  // - Stats (reviews/users) -> Cached short term
  // - Leaderboard -> Cached short term
  // - User specific status -> Dynamic (uncached)
  const [stats, leaderboard, attemptLimitStatus] = await Promise.all([
    getCachedQuizStats(quiz.id),
    getCachedLeaderboard(quiz.id, quiz.recurringType),
    (async () => {
      if (!user || !quiz.maxAttemptsPerUser) return null;
      const now = new Date();
      return getAttemptLimitStatus(prisma, {
        userId: user.id,
        quiz: {
          id: quiz.id,
          maxAttemptsPerUser: quiz.maxAttemptsPerUser,
          attemptResetPeriod: quiz.attemptResetPeriod,
        },
        referenceDate: now,
      });
    })()
  ]);

  const { uniqueUsersCount, recentReviews } = stats;
  const sidebarLeaderboard = leaderboard;

  const heroImageUrl = getValidImageUrl(quiz.descriptionImageUrl);
  const topicConfigs = ensureArray(quiz.topicConfigs);
  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  const playersLabel = formatPlayerCount(uniqueUsersCount);
  const badgeLabel = (topicConfigs[0] as any)?.topic?.name ?? quiz.sport ?? quiz.difficulty ?? "Quiz";
  const badgeTopicSlug = (topicConfigs[0] as any)?.topic?.slug ?? null;

  const maxAttempts = quiz.maxAttemptsPerUser ?? null;
  const remainingAttempts = attemptLimitStatus?.remainingBeforeStart ?? maxAttempts;
  const isLimitReached = attemptLimitStatus?.isLimitReached ?? (quiz.maxAttemptsPerUser != null && (remainingAttempts ?? 0) <= 0);

  // 3. Conditional Fetch: Only fetch best attempt if limit is reached (Dynamic)
  let bestAttemptId: string | null = null;
  if (isLimitReached && user) {
    const bestAttempt = await prisma.quizAttempt.findFirst({
      where: { userId: user.id, quizId: quiz.id, completedAt: { not: null }, isPracticeMode: false },
      orderBy: [{ totalPoints: "desc" }, { score: "desc" }, { completedAt: "desc" }],
      select: { id: true },
    });
    bestAttemptId = bestAttempt?.id ?? null;
  }

  const averageRating = typeof quiz.averageRating === "number" ? quiz.averageRating : 0;
  const totalReviews = typeof quiz.totalReviews === "number" ? quiz.totalReviews : quiz._count?.reviews ?? 0;
  const quizUrl = getCanonicalUrl(`/quizzes/${quiz.slug}`) || `/quizzes/${quiz.slug}`;
  const sportName = quiz.sport?.trim().toLowerCase();
  const matchedSportTopic = sportName
    ? topicConfigs.find((config: any) => config?.topic?.name?.trim()?.toLowerCase() === sportName)
    : null;
  const sportUrl = matchedSportTopic?.topic?.slug ? getCanonicalUrl(`/topics/${matchedSportTopic.topic.slug}`) : undefined;
  const quizSchema = getQuizSchema({
    id: quiz.id,
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description,
    sport: quiz.sport,
    sportUrl,
    difficulty: quiz.difficulty,
    duration: quiz.duration,
    passingScore: 0,
    descriptionImageUrl: heroImageUrl,
    averageRating,
    totalReviews,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
    topicConfigs: topicConfigs.map((config: any) => ({
      topic: {
        name: config?.topic?.name ?? "",
        slug: config?.topic?.slug,
      },
    })),
  });
  const { circle1, circle2, circle3 } = getBlurCircles();

  return (
    <>
      <JsonLdScript scriptKey={`quiz-jsonld-${quiz.id}`} data={quizSchema} />

      <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className={cn("absolute -left-[10%] top-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle1)} />
          <div className={cn("absolute -right-[10%] top-[20%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle2)} />
          <div className={cn("absolute left-[20%] -bottom-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle3)} />
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
                    {badgeTopicSlug ? (
                      <Link
                        href={`/topics/${badgeTopicSlug}`}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary shadow-neon-cyan/20 transition-opacity hover:opacity-80"
                      >
                        {badgeLabel}
                      </Link>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary shadow-neon-cyan/20">
                        {badgeLabel}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-xs font-black tracking-widest">{averageRating.toFixed(1)}</span>
                      <span className="text-[10px] font-bold text-muted-foreground ml-1">({totalReviews}) LOGS</span>
                    </div>
                  </div>

                  <h1 className={cn(
                    "text-4xl sm:text-6xl lg:text-8xl font-bold uppercase tracking-tighter leading-[0.9]",
                    getGradientText("editorial")
                  )}>
                    {quiz.title}
                  </h1>

                  <p className="max-w-2xl text-lg text-muted-foreground font-medium leading-relaxed">
                    {quiz.description || "Blitz through fresh trivia curated for diehard fans. Battle against the clock and climb your league leaderboard."}
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-4 sm:flex sm:flex-wrap sm:gap-4">
                    <div className="flex min-w-0 flex-col gap-1 rounded-[1.6rem] border border-white/5 p-4 glass-elevated sm:min-w-[140px] sm:rounded-[2rem] sm:p-6">
                      <Clock className="mb-1 h-4 w-4 text-secondary sm:mb-2 sm:h-5 sm:w-5" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Time</p>
                      <p className="text-xl font-black tracking-tighter sm:text-2xl">{durationLabel}</p>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1 rounded-[1.6rem] border border-white/5 p-4 glass-elevated sm:min-w-[140px] sm:rounded-[2rem] sm:p-6">
                      <ShieldCheck className="mb-1 h-4 w-4 text-primary sm:mb-2 sm:h-5 sm:w-5" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tier</p>
                      <p className="text-xl font-black tracking-tighter uppercase sm:text-2xl">{quiz.difficulty}</p>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1 rounded-[1.6rem] border border-white/5 p-4 glass-elevated sm:min-w-[140px] sm:rounded-[2rem] sm:p-6">
                      <Users className="mb-1 h-4 w-4 text-accent sm:mb-2 sm:h-5 sm:w-5" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Contenders</p>
                      <p className="text-xl font-black tracking-tighter sm:text-2xl">{playersLabel}</p>
                    </div>
                  </div>

                  <div className="pt-8 flex flex-wrap gap-4">
                    {isLimitReached && bestAttemptId ? (
                      <Link href={`/quizzes/${quiz.slug}/results/${bestAttemptId}`} className="w-full sm:w-auto">
                        <ShowcaseButton variant="neon" size="xl" className="w-full">VIEW RESULTS</ShowcaseButton>
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
                    <ShareQuizButton title={quiz.title} url={quizUrl} />
                  </div>
                </div>
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

              {/* Sidebar Leaderboard */}
              <div className="rounded-[2.5rem] p-8 glass-elevated border border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Quiz Leaders</h3>
                  </div>
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
                  Secure Quiz Environment. All attempts are verified for fair play and competitive integrity.
                </p>
              </div>
            </aside>
          </div>

          <div className="pt-12">
            <QuizCommentsSection
              quizSlug={quiz.slug}
              quizTitle={quiz.title}
              reviews={recentReviews}
            />
          </div>
        </PageContainer>
      </main>
    </>
  );
}
