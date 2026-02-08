import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShowcaseFeaturedQuizCard } from "@/components/quiz/ShowcaseFeaturedQuizCard";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Target, ShieldAlert, Activity } from "lucide-react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { PageContainer } from "@/components/shared/PageContainer";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Random Matrix | Sports Trivia",
  description: "Test your knowledge with a randomly selected sports trivia quiz.",
};

export default async function RandomQuizPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const { circle1, circle2, circle3 } = getBlurCircles();

  const attemptedQuizIds = await prisma.quizAttempt.findMany({
    where: { userId, completedAt: { not: null } },
    select: { quizId: true },
  });
  const attemptedIds = attemptedQuizIds.map((attempt) => attempt.quizId);

  const singleAttemptWhere: Prisma.QuizWhereInput = {
    isPublished: true,
    status: "PUBLISHED",
    maxAttemptsPerUser: 1,
    ...(attemptedIds.length > 0 ? { id: { notIn: attemptedIds } } : {}),
  };

  const availableCount = await prisma.quiz.count({ where: singleAttemptWhere });

  if (availableCount === 0) {
    return (
      <ShowcaseThemeProvider>
        <main className="relative min-h-screen overflow-hidden pt-24 pb-24">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className={cn("absolute -left-[10%] top-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle1)} />
            <div className={cn("absolute -right-[10%] top-[20%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle2)} />
            <div className={cn("absolute left-[20%] -bottom-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle3)} />
          </div>
          <PageContainer className="max-w-2xl px-4 py-20 text-center space-y-12">
            <div className="space-y-6">
              <div className="h-20 w-20 mx-auto rounded-[2rem] glass border border-white/10 flex items-center justify-center text-red-500/20 shadow-neon-magenta/5">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <div className="space-y-4">
                <h1 className={cn("text-5xl lg:text-7xl font-bold uppercase tracking-tighter", getGradientText("editorial"))}>NO MATRICES</h1>
                <p className="text-sm font-bold tracking-[0.2em] text-muted-foreground/60 uppercase">ALL SINGLE-ATTEMPT SECTORS HAVE BEEN RESOLVED</p>
              </div>
            </div>
            <Button asChild variant="glass" size="xl" className="rounded-2xl px-10">
              <Link href="/quizzes">RETURN TO REGISTRY</Link>
            </Button>
          </PageContainer>
        </main>
      </ShowcaseThemeProvider>
    );
  }

  const randomIndex = Math.floor(Math.random() * availableCount);
  const quiz = await prisma.quiz.findFirst({
    where: singleAttemptWhere,
    skip: randomIndex,
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { attempts: true } },
      topicConfigs: {
        include: { topic: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!quiz) redirect("/quizzes");

  const category = quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? "Arena";
  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  const playersLabel = formatPlayerCount(quiz._count?.attempts ?? 0);
  const difficultyLabel = (quiz.difficulty ?? "Medium").toString().toUpperCase().replace(/_/g, " ");
  const ratingLabel = quiz.averageRating && quiz.averageRating > 0 ? `${quiz.averageRating.toFixed(1)} / 5` : undefined;
  const accent = getSportGradient(quiz.sport);

  return (
    <ShowcaseThemeProvider>
      <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className={cn("absolute -left-[10%] top-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle1)} />
          <div className={cn("absolute -right-[10%] top-[20%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle2)} />
          <div className={cn("absolute left-[20%] -bottom-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle3)} />
        </div>

        <PageContainer className="space-y-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10 pt-4">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <h1 className={cn("text-5xl lg:text-8xl font-bold uppercase tracking-tighter leading-[1]", getGradientText("editorial"))}>
                  MATRIX SHIFT
                </h1>
              </div>
              <p className="text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase lg:pl-5 opacity-60">
                RANDOM SECTOR RESOLVED • INITIATING MISSION
              </p>
            </div>

            <Button asChild variant="glass" size="sm" className="rounded-2xl border-white/10 px-6 h-12 text-[10px] font-black uppercase tracking-widest">
              <Link href="/quizzes">
                <ArrowLeft className="mr-3 h-4 w-4" />
                REGISTRY
              </Link>
            </Button>
          </div>

          <div className="mx-auto flex w-full justify-center scale-[0.9] sm:scale-100 transition-transform origin-top">
            <ShowcaseFeaturedQuizCard
              title={quiz.title}
              subtitle={quiz.description}
              category={category}
              durationLabel={durationLabel}
              difficultyLabel={difficultyLabel}
              playersLabel={playersLabel}
              ratingLabel={ratingLabel}
              coverImageUrl={quiz.descriptionImageUrl ?? undefined}
              accent={accent}
              ctaHref={`/quizzes/${quiz.slug}`}
            />
          </div>
        </PageContainer>

        {/* Tactical decor */}
        <div className="fixed bottom-20 -left-20 pointer-events-none opacity-[0.03] rotate-12">
          <Target className="h-64 w-64" />
        </div>
        <div className="fixed top-1/2 -right-20 pointer-events-none opacity-[0.02]">
          <Activity className="h-96 w-96" />
        </div>
      </main>
    </ShowcaseThemeProvider>
  );
}
