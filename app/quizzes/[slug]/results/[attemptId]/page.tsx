import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Award,
  Zap,
  Trophy,
  ArrowLeft,
  Calendar,
  Coins,
} from "lucide-react";
import Image from "next/image";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ResultsShareButton } from "@/components/quiz/ResultsShareButton";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { PointsReward } from "@/components/shared/PointsReward";
import type { PointsBreakdown } from "@/components/shared/PointsReward.types";

interface QuizResultsPageProps {
  params: Promise<{ slug: string; attemptId: string }>;
}

function formatTime(seconds: number | null) {
  if (!seconds) return "0 sec";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds} sec`;
  if (remainingSeconds === 0) return `${minutes} min`;
  return `${minutes} min ${remainingSeconds} sec`;
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

  return (
    <ShowcaseThemeProvider>
      <div className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 px-4 py-12 dark:from-slate-900 dark:via-purple-900 dark:to-amber-500 sm:px-6 lg:py-16">
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-[120px] dark:bg-emerald-400/40" />
          <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/20 blur-[100px] dark:bg-pink-500/40" />
          <div className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/15 blur-[90px] dark:bg-blue-500/30" />
        </div>

        <div className="relative w-full max-w-5xl rounded-[1.75rem] border border-slate-200/60 bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-50/80 p-6 shadow-[0_40px_120px_-40px_rgba(59,130,246,0.15)] backdrop-blur-xl dark:border-white/10 dark:from-black/70 dark:via-slate-900/60 dark:to-indigo-900/80 dark:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] sm:p-8 lg:p-10">
          {/* Header */}
          <div className="mb-8">
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
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Quiz Results
            </h1>
            <p className="mt-2 text-sm text-slate-700 dark:text-white/70">{attempt.quiz.title}</p>
          </div>

          <div className="space-y-8">
          {/* Points Reward Display */}
            <PointsRewardServer points={attempt.totalPoints || 0} breakdown={breakdown} />

          {/* Score Summary Card */}
            <Card className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <div className="bg-gradient-to-br from-blue-500/10 via-emerald-400/10 to-transparent p-8 dark:from-emerald-400/10 dark:via-amber-400/10">
                <div className="flex flex-col items-center text-center">
                {/* Score Circle */}
                <div
                    className={`mb-4 flex h-32 w-32 items-center justify-center rounded-full border-4 ${attempt.passed ? "border-emerald-400/30" : "border-rose-400/30"} ${scoreBgColor}`}
                >
                  <div className="text-center">
                      <div className={`text-4xl font-bold ${scoreColor}`}>
                        {attempt.correctAnswers}/{attempt.totalQuestions}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-white/70">Correct</div>
                  </div>
                </div>

                {/* Pass/Fail Badge */}
                  <Badge
                    variant={attempt.passed ? "default" : "destructive"}
                    className={`mb-4 ${attempt.passed ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-400"}`}
                  >
                    {attempt.passed ? (
                      <>
                        <Trophy className="mr-1 h-4 w-4" />
                        Passed
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-4 w-4" />
                        Failed
                      </>
                    )}
                  </Badge>

                {/* Points Earned */}
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200/60 bg-white/60 px-3 py-2 text-slate-900 backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-white">
                    <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-semibold">{attempt.totalPoints} Points</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-white/70">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      {attempt.correctAnswers}/{attempt.totalQuestions}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-white/70">Correct</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-white/70">
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      {attempt.totalPoints}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-white/70">Points</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-white/70">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      {attempt.longestStreak}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-white/70">
                      Longest Streak
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-white/70">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      {formatTime(attempt.totalTimeSpent)}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-white/70">Time</div>
                  </div>
                </div>

                {/* Share */}
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <ResultsShareButton
                    quizTitle={attempt.quiz.title}
                    userName={attempt.user?.name || "Anonymous"}
                    score={attempt.score || 0}
                    correctAnswers={attempt.correctAnswers || 0}
                    totalQuestions={attempt.totalQuestions}
                    totalPoints={attempt.totalPoints || 0}
                    timeSpent={attempt.totalTimeSpent || 0}
                  />
                </div>
              </CardContent>
            </Card>

          {/* Tabs: Leaderboard and Answers */}
            <Tabs defaultValue="leaderboard">
              <TabsList className="mb-4">
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="answers">Answers</TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard">
                <Card className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Top Players</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {quizLeaderboard.map((entry, index) => (
                        <div key={entry.user?.id || (entry as any).id || entry.userId} className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/60 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex items-center justify-center">
                              {entry.user?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={entry.user.image} alt={entry.user.name || "User"} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-medium text-slate-600 dark:text-white/70">{(entry.user?.name || "U").charAt(0)}</span>
                              )}
                            </div>
                            <div className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-xs font-bold text-white">
                              {(index + 1).toString().padStart(2, '0')}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white">{entry.user?.name || "Anonymous"}</p>
                            <p className="text-sm text-slate-600 dark:text-white/70">{entry.bestPoints || Math.round(entry.bestScore || 0) || 0} points</p>
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200/60 bg-white/60 px-2 py-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/10">
                            <Coins className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{entry.bestPoints || Math.round(entry.bestScore || 0) || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="answers">
                <Card className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Answer Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  {attempt.userAnswers.map((userAnswer, index) => {
                const isCorrect = userAnswer.isCorrect && !userAnswer.wasSkipped;
                const wasSkipped = userAnswer.wasSkipped;
                const correctAnswer = correctAnswersMap.get(
                  userAnswer.questionId
                );

                return (
                  <div
                    key={userAnswer.id}
                      className="space-y-2 rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isCorrect
                            ? "bg-emerald-500 text-white"
                            : wasSkipped
                              ? "bg-amber-500 text-white"
                              : "bg-rose-500 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{userAnswer.question.questionText}</p>
                        
                        {userAnswer.question.questionImageUrl && (
                          <div className="relative mt-2 h-48 w-full max-w-md overflow-hidden rounded-lg">
                            <Image
                              src={userAnswer.question.questionImageUrl}
                              alt="Question"
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Your Answer */}
                    <div className="ml-11 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">
                          Your answer:
                        </span>
                        {wasSkipped ? (
                          <Badge variant="outline" className="text-amber-600">
                            Skipped
                          </Badge>
                        ) : userAnswer.answer ? (
                          <span>{userAnswer.answer.answerText}</span>
                        ) : (
                          <span className="text-muted-foreground">
                            No answer
                          </span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isCorrect ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500 text-emerald-600"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Correct
                          </Badge>
                        ) : wasSkipped ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500 text-amber-600"
                          >
                            Skipped
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-rose-500 text-rose-600"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Incorrect
                          </Badge>
                        )}
                      </div>

                      {/* Correct Answer (if revealed and wrong) */}
                      {revealAnswers &&
                        correctAnswer &&
                        !isCorrect &&
                        !wasSkipped && (
                          <div className="rounded-lg bg-emerald-500/10 p-3">
                            <p className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Correct answer:
                            </p>
                            <p className="text-sm">{correctAnswer.answerText}</p>
                          </div>
                        )}

                      {/* Explanation */}
                      {userAnswer.question.explanation && (
                        <div className="rounded-lg bg-muted p-3">
                          <p className="mb-1 text-xs font-medium text-muted-foreground">
                            Explanation:
                          </p>
                          <p className="text-sm">
                            {userAnswer.question.explanation}
                          </p>
                        </div>
                      )}

                      {/* Points Earned */}
                      {userAnswer.totalPoints !== null && userAnswer.totalPoints > 0 && (
                        <div className="text-xs text-muted-foreground">
                          +{userAnswer.totalPoints} points
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

          {/* Attempt Details removed per request */}

          {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Link href={`/quizzes/${slug}`}>
                <ShowcaseButton variant="secondary" size="md" icon={<ArrowLeft className="h-4 w-4" />}>
                  Back To Quiz
                </ShowcaseButton>
              </Link>
              <Link href="/quizzes">
                <ShowcaseButton variant="primary" size="md">
                  Browse More Quizzes
                </ShowcaseButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseThemeProvider>
  );
}
