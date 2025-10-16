"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface QuizPlayClientProps {
  quizId: string;
  quizTitle: string;
  quizSlug: string;
}

interface AttemptQuestion {
  id: string;
  questionText: string;
  questionImageUrl?: string | null;
  questionVideoUrl?: string | null;
  questionAudioUrl?: string | null;
  hint?: string | null;
  timeLimit?: number | null;
  answers: {
    id: string;
    answerText: string;
    answerImageUrl?: string | null;
    answerVideoUrl?: string | null;
    answerAudioUrl?: string | null;
  }[];
}

interface QuizConfig {
  timePerQuestion?: number | null;
  showHints?: boolean;
}

interface QuestionFeedback {
  isCorrect: boolean;
  wasSkipped: boolean;
  message: string;
  selectedAnswerId: string | null;
}

export function QuizPlayClient({ quizId, quizTitle, quizSlug }: QuizPlayClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState<"loading" | "in-progress" | "results" | "error">("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({});
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<AttemptQuestion | null>(null);
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [results, setResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isCompleting, startCompletion] = useTransition();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearAdvanceTimeout = () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  };

  const computeTimeLimit = useCallback(
    (question?: AttemptQuestion | null) => {
      if (!question) {
        return 60;
      }
      if (typeof question.timeLimit === "number" && question.timeLimit > 0) {
        return question.timeLimit;
      }
      if (quizConfig.timePerQuestion && quizConfig.timePerQuestion > 0) {
        return quizConfig.timePerQuestion;
      }
      return 60;
    },
    [quizConfig.timePerQuestion]
  );

  const resetTimerForQuestion = useCallback(
    (question?: AttemptQuestion | null) => {
      const limit = computeTimeLimit(question);
      setTimeLeft(limit);
    },
    [computeTimeLimit]
  );

  const fetchNextQuestion = useCallback(
    async (attemptIdentifier?: string) => {
      const activeAttemptId = attemptIdentifier ?? attemptId;
      if (!activeAttemptId) return;

      setIsLoadingQuestion(true);
      try {
        const response = await fetch(`/api/attempts/${activeAttemptId}/next`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load next question");
        }

        const { nextQuestion, position: nextPosition, total } = result.data;
        setTotalQuestions(total);
        setPosition(nextPosition);

        if (!nextQuestion) {
          // No more questions, complete attempt
          startCompletion(async () => {
            await completeAttempt(activeAttemptId);
          });
          return;
        }

        setCurrentQuestion(nextQuestion);
        setFeedback(null);
        resetTimerForQuestion(nextQuestion);
        setStatus("in-progress");
      } catch (error: any) {
        toast({
          title: "Unable to load question",
          description: error?.message || "An unexpected error occurred.",
          variant: "destructive",
        });
        setStatus("error");
      } finally {
        setIsLoadingQuestion(false);
      }
    },
    [attemptId, resetTimerForQuestion, startCompletion, toast]
  );

  const startAttempt = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/quizzes/${quizSlug}/play`)}`);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to start quiz");
      }

      const { attempt, quiz, totalQuestions: total } = result.data;
      setAttemptId(attempt.id);
      setQuizConfig({
        timePerQuestion: quiz.timePerQuestion,
        showHints: quiz.showHints,
      });
      setTotalQuestions(total);

      await fetchNextQuestion(attempt.id);
    } catch (error: any) {
      toast({
        title: "Unable to start quiz",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setStatus("error");
    }
  }, [fetchNextQuestion, quizId, quizSlug, router, toast]);

  useEffect(() => {
    startAttempt();

    return () => {
      clearTimer();
      clearAdvanceTimeout();
    };
  }, [startAttempt]);

  useEffect(() => {
    clearTimer();

    if (status !== "in-progress" || !currentQuestion || feedback) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          void handleAnswer(null, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentQuestion, feedback]);

  const completeAttempt = useCallback(
    async (attemptIdentifier?: string) => {
      const activeAttemptId = attemptIdentifier ?? attemptId;
      if (!activeAttemptId) return;

      try {
        const response = await fetch(`/api/attempts/${activeAttemptId}/complete`, {
          method: "POST",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to complete quiz");
        }

        setResults(result.data);
        setStatus("results");
        setFeedback(null);
        setCurrentQuestion(null);
      } catch (error: any) {
        toast({
          title: "Unable to complete quiz",
          description: error?.message || "An unexpected error occurred.",
          variant: "destructive",
        });
        setStatus("error");
      }
    },
    [attemptId, toast]
  );

  const handleAnswer = useCallback(
    async (answerId: string | null, fromTimer = false) => {
      if (
        status !== "in-progress" ||
        !attemptId ||
        !currentQuestion ||
        feedback ||
        isSubmitting
      ) {
        return;
      }

      setIsSubmitting(true);
      clearTimer();

      try {
        const timeLimit = computeTimeLimit(currentQuestion);
        const timeSpent = Math.max(timeLimit - timeLeft, 0);
        const response = await fetch(`/api/attempts/${attemptId}/answer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            answerId,
            timeSpent,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to submit answer");
        }

        const isLastQuestion = position >= totalQuestions - 1;

        setFeedback({
          isCorrect: result.data.isCorrect,
          wasSkipped: result.data.wasSkipped,
          message: result.data.message,
          selectedAnswerId: answerId,
        });

        clearAdvanceTimeout();
        advanceTimeoutRef.current = setTimeout(() => {
          if (isLastQuestion) {
            startCompletion(async () => {
              await completeAttempt();
            });
          } else {
            void fetchNextQuestion();
          }
        }, fromTimer ? 600 : 1200);
      } catch (error: any) {
        toast({
          title: "Submission failed",
          description: error?.message || "We couldn't record your answer.",
          variant: "destructive",
        });
        resetTimerForQuestion(currentQuestion);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      attemptId,
      completeAttempt,
      computeTimeLimit,
      currentQuestion,
      fetchNextQuestion,
      feedback,
      isSubmitting,
      position,
      resetTimerForQuestion,
      startCompletion,
      status,
      timeLeft,
      toast,
      totalQuestions,
    ]
  );

  const formattedTimeLeft = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Preparing your quiz…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Alert variant="destructive">
          <AlertTitle>We hit a snag</AlertTitle>
          <AlertDescription>
            We couldn&apos;t launch this quiz attempt. Please head back and try again.
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button variant="outline" onClick={() => router.push(`/quizzes/${quizSlug}`)}>
            Return to quiz details
          </Button>
        </div>
      </div>
    );
  }

  if (status === "results" && results) {
    return (
      <div className="mx-auto grid max-w-4xl gap-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-semibold">
                Score: {results.attempt.score.toFixed(1)}%
              </p>
              <p className="text-muted-foreground">
                {results.attempt.correctAnswers} / {results.attempt.totalQuestions} correct
              </p>
            </div>
            <Badge variant={results.attempt.passed ? "default" : "destructive"}>
              {results.attempt.passed ? "Passed" : "Did not pass"}
            </Badge>
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="rounded-md border border-muted-foreground/20 bg-muted/40 px-3 py-2">
                <p className="font-semibold text-foreground">Total Points</p>
                <p>{results.attempt.totalPoints}</p>
              </div>
              <div className="rounded-md border border-muted-foreground/20 bg-muted/40 px-3 py-2">
                <p className="font-semibold text-foreground">Longest Streak</p>
                <p>{results.attempt.longestStreak} correct</p>
              </div>
              <div className="rounded-md border border-muted-foreground/20 bg-muted/40 px-3 py-2">
                <p className="font-semibold text-foreground">Avg. Response Time</p>
                <p>{results.attempt.averageResponseTime.toFixed(1)} sec</p>
              </div>
              <div className="rounded-md border border-muted-foreground/20 bg-muted/40 px-3 py-2">
                <p className="font-semibold text-foreground">Total Time Spent</p>
                <p>{results.attempt.totalTimeSpent} sec</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push(`/quizzes/${quizSlug}`)}>Back to quiz</Button>
              <Button variant="outline" onClick={() => router.push("/quizzes")}>
                Browse more quizzes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.answers.map((answer: any, index: number) => (
              <div
                key={answer.questionId}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  answer.isCorrect
                    ? "border-green-500/40 bg-green-500/5"
                    : "border-red-500/40 bg-red-500/5"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Question {index + 1}
                    </p>
                    <p className="text-base font-semibold">{answer.questionText}</p>
                  </div>
                  <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                    {answer.isCorrect ? "Correct" : answer.wasSkipped ? "Skipped" : "Incorrect"}
                  </Badge>
                </div>
                {answer.explanation && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {answer.explanation}
                  </p>
                )}
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-foreground">Points:</span> {answer.totalPoints}
                    {answer.totalPoints > 0 && (
                      <span>
                        {" "}
                        (base {answer.basePoints}
                        {answer.timeBonus ? ", time " + answer.timeBonus : ""}
                        {answer.streakBonus ? ", streak " + answer.streakBonus : ""})
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Time:</span> {answer.timeSpent}s
                    {typeof answer.timeLimit === "number" && (
                      <span> / {answer.timeLimit}s</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingQuestion || !currentQuestion) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading next question…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{quizTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Question {position + 1} of {totalQuestions}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Time remaining</span>
          <Badge variant="outline" className={cn(timeLeft <= 5 && "border-red-500 text-red-600")}>
            {formattedTimeLeft}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {currentQuestion.questionText}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3">
            {currentQuestion.answers.map((answer) => {
              const isSelected = feedback?.selectedAnswerId === answer.id;
              const isCorrectSelection = isSelected && feedback?.isCorrect;
              const isIncorrectSelection =
                isSelected && !feedback?.isCorrect && !feedback?.wasSkipped;

              return (
                <Button
                  key={answer.id}
                  variant="outline"
                  className={cn(
                    "justify-start text-left",
                    isCorrectSelection && "border-green-500 bg-green-500/10 text-foreground",
                    isIncorrectSelection && "border-red-500 bg-red-500/10 text-foreground",
                    !feedback && "hover:border-primary hover:bg-primary/10"
                  )}
                  disabled={Boolean(feedback) || isSubmitting}
                  onClick={() => handleAnswer(answer.id)}
                >
                  {answer.answerText}
                </Button>
              );
            })}
          </div>

          {quizConfig.showHints && currentQuestion.hint && (
            <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-sm text-muted-foreground">
              Hint: {currentQuestion.hint}
            </div>
          )}

          {feedback && (
            <Alert
              variant={feedback.isCorrect ? "default" : "destructive"}
              className={cn(!feedback.isCorrect && "border-red-500 bg-red-500/5")}
            >
              <AlertTitle>{feedback.isCorrect ? "Correct!" : "Not quite"}</AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push(`/quizzes/${quizSlug}`)}>
          Quit quiz
        </Button>

        {feedback?.wasSkipped && (
          <span className="text-sm text-muted-foreground">
            Time expired. Moving to the next question…
          </span>
        )}

        {isCompleting && (
          <span className="text-sm text-muted-foreground">Calculating results…</span>
        )}
      </div>
    </div>
  );
}
