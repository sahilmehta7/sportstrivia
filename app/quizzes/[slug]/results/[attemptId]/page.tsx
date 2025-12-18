import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import Image from "next/image";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ResultsShareButton } from "@/components/quiz/ResultsShareButton";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { PointsReward } from "@/components/shared/PointsReward";
import type { PointsBreakdown } from "@/components/shared/PointsReward.types";
import { cn } from "@/lib/utils";
import {
  QuizResultsLayout,
  QuizResultsCard,
  QuizResultsHeader,
  QuizResultsSummary,
  QuizResultsStatsGrid,
  QuizResultsSection,
  QuizResultsLeaderboard,
  QuizResultsActions,
  QuizResultsReviewButton,
} from "@/components/quiz/results";
import { getTierForPoints } from "@/lib/services/progression.service";

interface QuizResultsPageProps {
  params: Promise<{ slug: string; attemptId: string }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}


// Server-side reward renderer using the showcase PointsReward component
function PointsRewardServer({ points, breakdown }: { points: number; breakdown: PointsBreakdown[] }) {
  return (
    <div className="mb-8">
      <PointsReward
        points={points}
        reason=""
        category="quiz"
        variant="inline"
        size="md"
        breakdown={breakdown}
      />
    </div>
  );
}

export default async function QuizResultsPage({
  params,
  searchParams,
}: QuizResultsPageProps) {
  const { slug, attemptId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const freshParam = resolvedSearchParams?.fresh;
  const isFresh =
    Array.isArray(freshParam) ? freshParam.some((value) => value === "1") : freshParam === "1";
  const session = await auth();

  if (!session?.user) {
    notFound();
  }

  // Get the quiz attempt with all details
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      userAnswers: {
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              questionImageUrl: true,
              explanation: true,
              explanationImageUrl: true,
              explanationVideoUrl: true,
              timeLimit: true,
            },
          },
          answer: {
            select: {
              id: true,
              answerText: true,
              answerImageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!attempt || attempt.userId !== session.user.id) {
    notFound();
  }

  if (!attempt.completedAt) {
    notFound();
  }

  if (attempt.quiz.slug !== slug) {
    notFound();
  }

  // Check if answers should be revealed
  const now = new Date();
  const revealAnswers =
    attempt.completedAt &&
    (!attempt.quiz.answersRevealTime ||
      attempt.quiz.answersRevealTime <= now);

  // Get correct answers if they should be revealed
  let correctAnswersMap = new Map();
  if (revealAnswers) {
    const questionIds = attempt.userAnswers.map((ua) => ua.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: {
        answers: {
          where: { isCorrect: true },
          select: {
            id: true,
            answerText: true,
            answerImageUrl: true,
          },
        },
      },
    });

    for (const question of questions) {
      const correctAnswer = question.answers[0];
      if (correctAnswer) {
        correctAnswersMap.set(question.id, correctAnswer);
      }
    }
  }


  // Build quiz-specific leaderboard (top 10) with recurring aggregation support
  let quizLeaderboard:
    | Array<{
      userId: string;
      user: { id: string; name: string | null; image: string | null } | null;
      bestPoints?: number | null;
      bestScore?: number | null;
      averageResponseTime?: number | null;
    }>
    | [] = [];

  if (attempt.quiz.recurringType === "DAILY" || attempt.quiz.recurringType === "WEEKLY") {
    const isDaily = attempt.quiz.recurringType === "DAILY";
    const rows = await prisma.$queryRaw<Array<{
      userId: string;
      bestPoints: number;
      avg_response: number | null;
      name: string | null;
      image: string | null;
    }>>(
      isDaily
        ? Prisma.sql`
            WITH per_period_best AS (
              SELECT
                "userId",
                date_trunc('day', "completedAt") AS period_start,
                MAX("totalPoints") AS best_points,
                AVG(COALESCE("averageResponseTime", 0)) AS avg_response
              FROM "QuizAttempt"
              WHERE "quizId" = ${attempt.quiz.id}
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
            SELECT a."userId", a.sum_points::int AS "bestPoints", a.avg_response, u.name, u.image
            FROM aggregated a
            JOIN "User" u ON u.id = a."userId"
            ORDER BY a.sum_points DESC, a.avg_response ASC
            LIMIT 10
          `
        : Prisma.sql`
            WITH per_period_best AS (
              SELECT
                "userId",
                date_trunc('week', "completedAt") AS period_start,
                MAX("totalPoints") AS best_points,
                AVG(COALESCE("averageResponseTime", 0)) AS avg_response
              FROM "QuizAttempt"
              WHERE "quizId" = ${attempt.quiz.id}
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
            SELECT a."userId", a.sum_points::int AS "bestPoints", a.avg_response, u.name, u.image
            FROM aggregated a
            JOIN "User" u ON u.id = a."userId"
            ORDER BY a.sum_points DESC, a.avg_response ASC
            LIMIT 10
          `
    );

    quizLeaderboard = rows.map((r) => ({
      userId: r.userId,
      user: { id: r.userId, name: r.name, image: r.image },
      bestPoints: r.bestPoints,
      averageResponseTime: r.avg_response ?? 0,
    }));
  } else {
    quizLeaderboard = await prisma.quizLeaderboard.findMany({
      where: {
        quizId: attempt.quiz.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: [
        { bestPoints: "desc" },
        { averageResponseTime: "asc" },
        { bestScore: "desc" },
      ],
      take: 10,
    });
  }

  const userProgressPromise = prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      totalPoints: true,
      experienceTier: true,
    },
  });

  const existingReviewPromise = prisma.quizReview.findUnique({
    where: {
      userId_quizId: {
        userId: session.user.id,
        quizId: attempt.quiz.id,
      },
    },
    select: {
      id: true,
      rating: true,
      comment: true,
    },
  });

  const [userProgressData, existingReview] = await Promise.all([
    userProgressPromise,
    existingReviewPromise,
  ]);

  const totalPoints = userProgressData?.totalPoints ?? 0;
  const tierInfo = getTierForPoints(totalPoints);
  const progression = {
    tierLabel: tierInfo.tierLabel,
    totalPoints,
    nextTierLabel: tierInfo.nextTierLabel,
    pointsToNext: tierInfo.pointsToNext,
    progressPercent: tierInfo.progressPercent,
  };

  // Compute breakdown for reward component
  const attemptAny = attempt as any;
  const perQuestionPoints = (attemptAny.userAnswers || []).reduce((sum: number, ua: any) => sum + (ua.totalPoints || 0), 0);
  const completionBonus = Number(attemptAny.quiz?.completionBonus || 0);
  const completionPart = Math.max(0, Math.min((attempt.totalPoints || 0) - perQuestionPoints, completionBonus));
  const breakdown: PointsBreakdown[] = [
    { label: "Speed + Accuracy", points: perQuestionPoints, icon: "⚡🎯" },
    ...(completionPart > 0 ? [{ label: "Completion Bonus", points: completionPart, icon: "🏆" }] : []),
  ];

  const summaryData = {
    quizTitle: attempt.quiz.title,
    userName: attempt.user?.name || "Anonymous",
    userImage: attempt.user?.image,
    correctAnswers: attempt.correctAnswers || 0,
    totalQuestions: attempt.totalQuestions,
    totalPoints: attempt.totalPoints || 0,
    timeSpentSeconds: attempt.totalTimeSpent || 0,
    passed: attempt.passed ?? false,
    longestStreak: attempt.longestStreak || 0,
    averageResponseTimeSeconds: attempt.averageResponseTime || 0,
  };

  const leaderboardEntries = quizLeaderboard.map((entry, index) => {
    const user = (entry as any).user ?? null;
    const totalPoints =
      Number((entry as any).bestPoints ?? entry.bestPoints ?? entry.bestScore ?? 0) || 0;

    return {
      userId: (entry as any).userId ?? user?.id ?? `anonymous-${index}`,
      userName: user?.name ?? null,
      userImage: user?.image ?? null,
      score: totalPoints,
      totalPoints,
      rank: index + 1,
    };
  });

  return (
    <ShowcaseThemeProvider>
      <QuizResultsLayout>
        <div className="space-y-10">

          <div className="flex flex-col items-center space-y-8">
            <QuizResultsHeader
              title="Quiz Results"
              subtitle={attempt.quiz.title}
              className="text-center"
            />

            {isFresh && (
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-6 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-200">
                Quiz completed! Summary ready below.
              </div>
            )}

            <QuizResultsSummary
              data={summaryData}
              confetti
              className="w-full max-w-2xl"
              footer={
                <div className="flex flex-col items-center gap-3">
                  <Badge
                    variant={attempt.passed ? "default" : "destructive"}
                    className={cn(
                      "scale-110 px-4 py-1.5 text-sm",
                      attempt.passed
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-400",
                    )}
                  >
                    {attempt.passed ? (
                      <>
                        <Trophy className="mr-1.5 h-4 w-4" />
                        Passed
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1.5 h-4 w-4" />
                        Failed
                      </>
                    )}
                  </Badge>
                </div>
              }
            />

            <QuizResultsStatsGrid data={summaryData} className="w-full max-w-4xl" />

            <div className="grid w-full gap-8 lg:grid-cols-2">
              <QuizResultsSection
                title="Points & Progress"
                className="h-full rounded-[1.5rem] bg-white/40 p-6 shadow-sm backdrop-blur-md dark:bg-white/5"
              >
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/60">
                      Total points earned
                    </p>
                    <PointsRewardServer points={attempt.totalPoints || 0} breakdown={breakdown} />
                  </div>
                  {progression ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/60">
                            Current tier
                          </p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {progression.tierLabel}
                          </p>
                        </div>
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                          {progression.tierLabel}
                        </Badge>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-white/10">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all"
                          style={{ width: `${progression.progressPercent}%` }}
                        />
                      </div>
                      {progression.pointsToNext !== null ? (
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          {progression.pointsToNext.toLocaleString()} points until{" "}
                          {progression.nextTierLabel}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          You&apos;ve reached the top tier—legend status!
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </QuizResultsSection>

              <div className="flex h-full flex-col justify-center gap-6 rounded-[1.5rem] bg-white/40 p-6 shadow-sm backdrop-blur-md dark:bg-white/5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Next Steps</h3>
                <QuizResultsActions
                  className="flex-col items-stretch gap-3"
                  primaryAction={
                    <ResultsShareButton
                      quizTitle={attempt.quiz.title}
                      userName={attempt.user?.name || "Anonymous"}
                      score={attempt.score || 0}
                      correctAnswers={attempt.correctAnswers || 0}
                      totalQuestions={attempt.totalQuestions}
                      totalPoints={attempt.totalPoints || 0}
                      timeSpent={attempt.totalTimeSpent || 0}
                    >
                      <span className="w-full">Share Results</span>
                    </ResultsShareButton>
                  }
                  secondaryAction={
                    <Link href="/quizzes" className="w-full">
                      <ShowcaseButton variant="secondary" size="md" className="w-full">
                        Browse Quizzes
                      </ShowcaseButton>
                    </Link>
                  }
                  extraActions={
                    <QuizResultsReviewButton
                      quizSlug={slug}
                      quizTitle={attempt.quiz.title}
                      existingReview={existingReview}
                    />
                  }
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="leaderboard" className="space-y-4">
            <TabsList className="mx-auto flex w-full max-w-xs justify-center gap-2 rounded-full border border-slate-200/60 bg-white/70 p-1 backdrop-blur-sm dark:border-white/20 dark:bg-white/10">
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="answers">Answers</TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard">
              <QuizResultsCard className="mt-4">
                <QuizResultsSection title="Top Players" className="p-6">
                  <QuizResultsLeaderboard entries={leaderboardEntries} />
                </QuizResultsSection>
              </QuizResultsCard>
            </TabsContent>

            <TabsContent value="answers">
              <QuizResultsCard className="mt-4">
                <QuizResultsSection
                  title="Answer Review"
                  className="space-y-4 p-6"
                >
                  {attempt.userAnswers.map((userAnswer, index) => {
                    const isCorrect = userAnswer.isCorrect && !userAnswer.wasSkipped;
                    const wasSkipped = userAnswer.wasSkipped;
                    const correctAnswer = correctAnswersMap.get(userAnswer.questionId);

                    return (
                      <div
                        key={userAnswer.id}
                        className="space-y-2 rounded-2xl border border-white/40 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                              isCorrect ? "bg-emerald-500" : wasSkipped ? "bg-amber-500" : "bg-rose-500",
                            )}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {userAnswer.question.questionText}
                            </p>

                            {userAnswer.question.questionImageUrl ? (
                              <div className="relative mt-2 h-48 w-full max-w-md overflow-hidden rounded-lg">
                                <Image
                                  src={userAnswer.question.questionImageUrl}
                                  alt="Question"
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="ml-11 space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-slate-600 dark:text-white/70">Your answer:</span>
                            {wasSkipped ? (
                              <Badge variant="outline" className="border-amber-500 text-amber-600">
                                Skipped
                              </Badge>
                            ) : userAnswer.answer ? (
                              <span>{userAnswer.answer.answerText}</span>
                            ) : (
                              <span className="text-slate-500 dark:text-white/50">No answer</span>
                            )}
                          </div>

                          <div>
                            {isCorrect ? (
                              <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Correct
                              </Badge>
                            ) : wasSkipped ? (
                              <Badge variant="outline" className="border-amber-500 text-amber-600">
                                Skipped
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-rose-500 text-rose-600">
                                <XCircle className="mr-1 h-3 w-3" />
                                Incorrect
                              </Badge>
                            )}
                          </div>

                          {revealAnswers && correctAnswer && !isCorrect && !wasSkipped ? (
                            <div className="rounded-lg bg-emerald-500/10 p-3">
                              <p className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                Correct answer:
                              </p>
                              <p className="text-sm text-slate-900 dark:text-white">{correctAnswer.answerText}</p>
                            </div>
                          ) : null}

                          {userAnswer.question.explanation ? (
                            <div className="rounded-lg bg-slate-100/70 p-3 text-sm text-slate-700 dark:bg-white/10 dark:text-white/80">
                              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-white/60">
                                Explanation
                              </p>
                              <p>{userAnswer.question.explanation}</p>
                            </div>
                          ) : null}

                          {userAnswer.totalPoints ? (
                            <div className="text-xs text-slate-500 dark:text-white/60">
                              +{userAnswer.totalPoints} points
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </QuizResultsSection>
              </QuizResultsCard>
            </TabsContent>
          </Tabs>
        </div>
      </QuizResultsLayout>
    </ShowcaseThemeProvider>
  );
}
