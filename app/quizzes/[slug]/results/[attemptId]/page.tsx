import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowLeft,
} from "lucide-react";
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
} from "@/components/quiz/results";

interface QuizResultsPageProps {
  params: Promise<{ slug: string; attemptId: string }>;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// Server-side reward renderer using the showcase PointsReward component
function PointsRewardServer({ points, breakdown }: { points: number; breakdown: PointsBreakdown[] }) {
  return (
    <div className="mb-8">
      <PointsReward
        points={points}
        reason="Quiz completed! Great job!"
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
}: QuizResultsPageProps) {
  const { slug, attemptId } = await params;
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

  const scoreColor = attempt.passed
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
  const scoreBgColor = attempt.passed
    ? "bg-emerald-500/10"
    : "bg-rose-500/10";

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
      Number((entry as any).bestPoints ?? entry.bestPoints ?? entry.totalPoints ?? entry.bestScore ?? 0) || 0;

    return {
      userId: (entry as any).userId ?? user?.id ?? `anonymous-${index}`,
      userName: user?.name ?? null,
      userImage: user?.image ?? null,
      score: totalPoints,
      totalPoints,
      rank: index + 1,
    };
  });

  const userLeaderboardIndex = leaderboardEntries.findIndex((entry) => entry.userId === attempt.userId);
  const displayLeaderboard =
    userLeaderboardIndex >= 0 && userLeaderboardIndex < 3
      ? leaderboardEntries.slice(0, 3)
      : [
          ...leaderboardEntries.slice(0, 3),
          ...(userLeaderboardIndex >= 3 ? [leaderboardEntries[userLeaderboardIndex]] : []),
        ];

  return (
    <ShowcaseThemeProvider>
      <QuizResultsLayout>
        <div className="space-y-10">
          <QuizResultsCard>
            <QuizResultsHeader
              title="Quiz Results"
              subtitle={attempt.quiz.title}
              leading={
                <Link href={`/quizzes/${slug}`}>
                  <ShowcaseButton
                    variant="ghost"
                    size="sm"
                    icon={<ArrowLeft className="h-4 w-4" />}
                    ariaLabel="Back to quiz"
                  >
                    Back to quiz
                  </ShowcaseButton>
                </Link>
              }
            />

            <div className="space-y-8 p-6">
              <PointsRewardServer points={attempt.totalPoints || 0} breakdown={breakdown} />

              <QuizResultsSummary
                data={summaryData}
                confetti
                footer={
                  <div className="flex flex-col items-center gap-3">
                    <Badge
                      variant={attempt.passed ? "default" : "destructive"}
                      className={cn(
                        "px-4 py-1.5 text-sm",
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
                    <p className="text-xs text-slate-600 dark:text-white/60">
                      Completed {formatDateTime(attempt.completedAt!)}
                    </p>
                  </div>
                }
              />

              <QuizResultsStatsGrid data={summaryData} />

              <QuizResultsSection
                title="See where you stand"
                className="rounded-[1.5rem] bg-gradient-to-br from-slate-50/70 to-blue-50/60 p-6 dark:from-white/5 dark:to-white/5"
              >
                <QuizResultsLeaderboard entries={displayLeaderboard} />
              </QuizResultsSection>

              <QuizResultsActions
                className="justify-center"
                primaryAction={
                  <ResultsShareButton
                    quizTitle={attempt.quiz.title}
                    userName={attempt.user?.name || "Anonymous"}
                    score={attempt.score || 0}
                    correctAnswers={attempt.correctAnswers || 0}
                    totalQuestions={attempt.totalQuestions}
                    totalPoints={attempt.totalPoints || 0}
                    timeSpent={attempt.totalTimeSpent || 0}
                  />
                }
                secondaryAction={
                  <Link href="/quizzes">
                    <ShowcaseButton variant="secondary" size="md">
                      Browse More Quizzes
                    </ShowcaseButton>
                  </Link>
                }
                extraActions={
                  <Link href={`/quizzes/${slug}`}>
                    <ShowcaseButton variant="ghost" size="md" icon={<ArrowLeft className="h-4 w-4" />}>
                      Back To Quiz
                    </ShowcaseButton>
                  </Link>
                }
              />
            </div>
          </QuizResultsCard>

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
