import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import Image from "next/image";

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
      quiz: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          descriptionImageUrl: true,
          passingScore: true,
          answersRevealTime: true,
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

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link
            href={`/quizzes/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quiz
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Quiz Results
          </h1>
          <p className="mt-2 text-muted-foreground">{attempt.quiz.title}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          {/* Score Summary Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
              <div className="flex flex-col items-center text-center">
                {/* Score Circle */}
                <div
                  className={`mb-4 flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary/20 ${scoreBgColor}`}
                >
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${scoreColor}`}>
                      {attempt.score.toFixed(1)}%
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Score</div>
                  </div>
                </div>

                {/* Pass/Fail Badge */}
                <Badge
                  variant={attempt.passed ? "default" : "destructive"}
                  className="mb-4"
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

                {/* Passing Score */}
                <p className="text-sm text-muted-foreground">
                  Required: {attempt.quiz.passingScore}% to pass
                </p>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {attempt.correctAnswers}/{attempt.totalQuestions}
                  </div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {attempt.totalPoints}
                  </div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {attempt.longestStreak}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Longest Streak
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {formatTime(attempt.totalTimeSpent)}
                  </div>
                  <div className="text-xs text-muted-foreground">Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Answers Review */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
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
                    className="space-y-2 rounded-lg border p-4"
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

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Attempt Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started:</span>
                <span>{formatDateTime(attempt.startedAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span>{formatDateTime(attempt.completedAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>
                  {formatTime(
                    attempt.completedAt
                      ? Math.floor(
                          (attempt.completedAt.getTime() -
                            attempt.startedAt.getTime()) /
                            1000
                        )
                      : 0
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode:</span>
                <span>
                  {attempt.isPracticeMode ? (
                    <Badge variant="secondary">Practice</Badge>
                  ) : (
                    <Badge variant="default">Regular</Badge>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href={`/quizzes/${slug}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Quiz
              </Button>
            </Link>
            <Link href="/quizzes">
              <Button variant="outline">
                Browse More Quizzes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
