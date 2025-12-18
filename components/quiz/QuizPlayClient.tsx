"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AttemptResetPeriod } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { AttemptLimitBanner } from "@/components/quiz/AttemptLimitBanner";
import { ENABLE_NEW_QUIZ_UI } from "@/lib/config/quiz-ui";
import { QuizPlayUI } from "@/components/quiz/QuizPlayUI";
import { trackEvent } from "@/lib/analytics";

interface AttemptLimitClientInfo {
  max: number;
  remaining: number | null;
  period: AttemptResetPeriod;
  resetAt: string | null;
  isLocked?: boolean;
}

interface QuizPlayClientProps {
  quizId: string;
  quizTitle: string;
  quizSlug: string;
  initialAttemptLimit?: AttemptLimitClientInfo | null;
}

interface AttemptQuestion {
  id: string;
  questionText: string;
  questionImageUrl?: string | null;
  questionVideoUrl?: string | null;
  questionAudioUrl?: string | null;
  hint?: string | null;
  explanation?: string | null;
  explanationImageUrl?: string | null;
  explanationVideoUrl?: string | null;
  timeLimit?: number | null;
  correctAnswerId: string | null;
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
  correctAnswerId: string | null;
  correctAnswerText: string | null;
  explanation?: string | null;
}

export function QuizPlayClient({ quizId, quizTitle, quizSlug, initialAttemptLimit }: QuizPlayClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<
    "loading" | "in-progress" | "error" | "limit-reached" | "redirecting"
  >("loading");
  const attemptIdRef = useRef<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({});
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<AttemptQuestion | null>(null);
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentTimeLimit, setCurrentTimeLimit] = useState<number>(60);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [isCompleting, startCompletion] = useTransition();
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const reviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attemptLimit, setAttemptLimit] = useState<AttemptLimitClientInfo | null>(
    initialAttemptLimit ?? null
  );
  const [limitLockInfo, setLimitLockInfo] = useState<AttemptLimitClientInfo | null>(
    initialAttemptLimit?.isLocked ? initialAttemptLimit : null
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

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
      setCurrentTimeLimit(limit);
      setTimeLeft(limit);
    },
    [computeTimeLimit]
  );

  const batchedAnswersRef = useRef<Array<{
    questionId: string;
    answerId: string | null;
    timeSpent: number;
  }>>([]);

  const completeAttempt = useCallback(
    async (attemptIdentifier?: string) => {
      const activeAttemptId = attemptIdentifier ?? attemptIdRef.current;
      if (!activeAttemptId) return;

      try {
        const response = await fetch(`/api/attempts/${activeAttemptId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: batchedAnswersRef.current,
          }),
        });

        trackEvent("quiz_complete", { quizId, quizTitle, attemptId: activeAttemptId });

        const result = await response.json();

        if (!response.ok) {
          const message = result.error || "Failed to complete quiz";

          const shouldAttemptFallback = () => {
            if (response.status === 401 || response.status === 403) {
              return false;
            }

            if (
              response.status === 400 &&
              typeof result.error === "string" &&
              result.error.toLowerCase().includes("already completed")
            ) {
              return true;
            }

            return response.status >= 500 || response.status === 409;
          };

          const tryLoadExistingAttempt = async () => {
            try {
              const fallback = await fetch(`/api/attempts/${activeAttemptId}`);
              const fallbackJson = await fallback.json();

              if (fallback.ok && fallbackJson?.data?.attempt?.id) {
                const attemptedSlug = fallbackJson.data?.quiz?.slug ?? quizSlug;
                setFeedback(null);
                setCurrentQuestion(null);
                setStatus("redirecting");
                router.push(`/quizzes/${attemptedSlug}/results/${fallbackJson.data.attempt.id}?fresh=1`);
                return true;
              }
            } catch (fallbackError) {
              console.error("Failed to load fallback attempt results", fallbackError);
            }

            return false;
          };

          if (shouldAttemptFallback() && (await tryLoadExistingAttempt())) {
            return;
          }

          throw new Error(message);
        }

        const attemptData = result.data?.attempt;
        const attemptQuiz = result.data?.quiz;

        if (attemptData?.id) {
          const destinationSlug = attemptQuiz?.slug ?? quizSlug;
          setFeedback(null);
          setCurrentQuestion(null);
          setStatus("redirecting");
          router.push(`/quizzes/${destinationSlug}/results/${attemptData.id}?fresh=1`);
          return;
        }

        throw new Error("Missing attempt details after completion");
      } catch (error: any) {
        toast({
          title: "Unable to complete quiz",
          description: error?.message || "An unexpected error occurred.",
          variant: "destructive",
        });
        setStatus("error");
      }
    },
    [quizId, quizTitle, quizSlug, router, toast]
  );

  const startAttempt = useCallback(async () => {
    setStatus("loading");
    clearTimer();
    clearAdvanceTimeout();
    // Reset batched answers on new attempt
    batchedAnswersRef.current = [];

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
        if (result?.code === "ATTEMPT_LIMIT_REACHED") {
          const limitInfo: AttemptLimitClientInfo = {
            max: result.limit ?? initialAttemptLimit?.max ?? 0,
            remaining: 0,
            period:
              (result.period as AttemptResetPeriod | undefined) ??
              initialAttemptLimit?.period ??
              AttemptResetPeriod.NEVER,
            resetAt: result.resetAt ?? initialAttemptLimit?.resetAt ?? null,
            isLocked: true,
          };

          setAttemptLimit(limitInfo);
          setLimitLockInfo(limitInfo);
          setStatus("limit-reached");
          return;
        }

        throw new Error(result.error || "Failed to start quiz");
      }

      const {
        attempt,
        quiz,
        totalQuestions: totalFromServer,
        attemptLimit: attemptLimitMeta,
        questions: questionBundle,
      } = result.data;

      attemptIdRef.current = attempt.id;
      setQuizConfig({
        timePerQuestion: quiz.timePerQuestion,
        showHints: quiz.showHints,
      });

      if (attemptLimitMeta) {
        const normalized: AttemptLimitClientInfo = {
          max: attemptLimitMeta.max,
          remaining:
            typeof attemptLimitMeta.remaining === "number"
              ? Math.max(attemptLimitMeta.remaining, 0)
              : null,
          period: attemptLimitMeta.period as AttemptResetPeriod,
          resetAt: attemptLimitMeta.resetAt ?? null,
          isLocked:
            typeof attemptLimitMeta.remaining === "number"
              ? attemptLimitMeta.remaining <= 0
              : false,
        };
        setAttemptLimit(normalized);
        setLimitLockInfo(null);
      } else {
        setAttemptLimit(null);
        setLimitLockInfo(null);
      }

      const readyQuestions: AttemptQuestion[] = Array.isArray(questionBundle)
        ? questionBundle
        : [];

      if (!readyQuestions.length) {
        throw new Error("Quiz has no questions available right now.");
      }

      trackEvent("quiz_start", { quizId, quizTitle });

      setQuestions(readyQuestions);
      setTotalQuestions(readyQuestions.length || totalFromServer || 0);
      setCurrentIndex(0);
      setFeedback(null);

      const firstQuestion = readyQuestions[0] ?? null;
      setCurrentQuestion(firstQuestion);

      const initialLimit = firstQuestion
        ? firstQuestion.timeLimit ?? quiz.timePerQuestion ?? 60
        : quiz.timePerQuestion ?? 60;

      setCurrentTimeLimit(initialLimit);
      setTimeLeft(initialLimit);

      setStatus("in-progress");
    } catch (error: any) {
      toast({
        title: "Unable to start quiz",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setStatus("error");
    }
  }, [clearAdvanceTimeout, clearTimer, initialAttemptLimit, quizId, quizSlug, quizTitle, router, toast]);

  useEffect(() => {
    if (initialAttemptLimit?.isLocked) {
      setStatus("limit-reached");
      setLimitLockInfo(initialAttemptLimit);
      setAttemptLimit(initialAttemptLimit);
      return () => undefined;
    }

    startAttempt();

    return () => {
      clearTimer();
      clearAdvanceTimeout();
    };
  }, [clearAdvanceTimeout, clearTimer, initialAttemptLimit, startAttempt]);

  const handleAnswer = useCallback(
    async (answerId: string | null, fromTimer = false) => {
      if (
        status !== "in-progress" ||
        !attemptIdRef.current ||
        !currentQuestion ||
        feedback ||
        pendingQuestionId === currentQuestion.id
      ) {
        return;
      }

      setPendingQuestionId(currentQuestion.id);
      clearTimer();

      const timeLimit = computeTimeLimit(currentQuestion);
      const timeSpent = Math.max(timeLimit - timeLeft, 0);
      const wasSkipped = fromTimer || answerId === null;

      const correctAnswerId = currentQuestion.correctAnswerId;
      const correctAnswerText =
        currentQuestion.answers.find((answer) => answer.id === correctAnswerId)?.answerText ?? null;

      const optimisticIsCorrect =
        !!answerId && !!correctAnswerId && answerId === correctAnswerId && !wasSkipped;

      const previousIndex = currentIndex;
      const nextIndex = currentIndex + 1;
      const nextQuestion = questions[nextIndex];
      const isLastQuestion = previousIndex >= totalQuestions - 1;

      // Batch the answer locally
      batchedAnswersRef.current.push({
        questionId: currentQuestion.id,
        answerId,
        timeSpent,
      });

      setFeedback({
        isCorrect: optimisticIsCorrect,
        wasSkipped,
        message: wasSkipped
          ? "Question skipped"
          : optimisticIsCorrect
            ? "Correct answer!"
            : "Incorrect answer",
        selectedAnswerId: answerId,
        correctAnswerId,
        correctAnswerText,
        explanation: currentQuestion.explanation ?? null,
      });

      clearAdvanceTimeout();

      // Only auto-advance with old timeout if NOT using new UI
      if (!isLastQuestion && nextQuestion && !ENABLE_NEW_QUIZ_UI) {
        advanceTimeoutRef.current = setTimeout(() => {
          setCurrentIndex(nextIndex);
          setCurrentQuestion(nextQuestion);
          setFeedback(null);
          resetTimerForQuestion(nextQuestion);
          setPendingQuestionId(null);
        }, fromTimer ? 350 : 550);
      } else if (isLastQuestion) {
        // Last question - submit everything
        if (ENABLE_NEW_QUIZ_UI) {
          setIsReviewing(false);
          startCompletion(async () => {
            await completeAttempt();
          });
        } else {
          startCompletion(async () => {
            await completeAttempt();
          });
        }
        setPendingQuestionId(null);
      } else {
        // Just clear pending state, UI handles the rest (Review Button or similar)
        setPendingQuestionId(null);
      }
    },
    [
      clearAdvanceTimeout,
      clearTimer,
      completeAttempt,
      computeTimeLimit,
      currentIndex,
      currentQuestion,
      feedback,
      pendingQuestionId,
      questions,
      resetTimerForQuestion,
      startCompletion,
      status,
      timeLeft,
      totalQuestions,
    ]
  );

  useEffect(() => {
    clearTimer();

    if (status !== "in-progress" || !currentQuestion || feedback) {
      return () => {
        clearTimer();
      };
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
  }, [clearTimer, currentQuestion, feedback, handleAnswer, status]);

  useEffect(() => {
    return () => {
      clearAdvanceTimeout();
      if (reviewTimeoutRef.current) {
        clearTimeout(reviewTimeoutRef.current);
        reviewTimeoutRef.current = null;
      }
    };
  }, [clearAdvanceTimeout]);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswerId(null);
    setIsReviewing(false);
    if (reviewTimeoutRef.current) {
      clearTimeout(reviewTimeoutRef.current);
      reviewTimeoutRef.current = null;
    }
  }, [currentQuestion?.id]);

  // Handle answer selection for new UI
  const handleAnswerSelect = useCallback(
    (answerId: string) => {
      if (status !== "in-progress" || !currentQuestion || feedback || isReviewing) {
        return;
      }
      setSelectedAnswerId(answerId);
    },
    [status, currentQuestion, feedback, isReviewing]
  );

  // Handle next button for new UI (with review flow)
  const handleNext = useCallback(async () => {
    if (!selectedAnswerId || !currentQuestion || isReviewing || feedback) {
      return;
    }

    // Start review phase
    setIsReviewing(true);
    clearTimer();

    try {
      // Submit answer (this will set feedback)
      await handleAnswer(selectedAnswerId, false);

      // After answer is submitted and feedback is set, start review timeout
      const isLastQuestion = currentIndex >= totalQuestions - 1;
      if (!isLastQuestion) {
        reviewTimeoutRef.current = setTimeout(() => {
          const nextIndex = currentIndex + 1;
          const nextQuestion = questions[nextIndex];
          if (nextQuestion) {
            setCurrentIndex(nextIndex);
            setCurrentQuestion(nextQuestion);
            setFeedback(null);
            setSelectedAnswerId(null);
            setIsReviewing(false);
            resetTimerForQuestion(nextQuestion);
          }
        }, 900);
      }
    } catch {
      // handleAnswer will handle error display, just reset review state
      setIsReviewing(false);
      if (reviewTimeoutRef.current) {
        clearTimeout(reviewTimeoutRef.current);
        reviewTimeoutRef.current = null;
      }
    }
  }, [
    selectedAnswerId,
    currentQuestion,
    isReviewing,
    feedback,
    handleAnswer,
    currentIndex,
    totalQuestions,
    questions,
    resetTimerForQuestion,
    clearTimer,
  ]);

  useEffect(() => {
    if (typeof performance !== "undefined" && status === "in-progress" && currentQuestion) {
      performance.mark(`quiz-question-ready-${currentQuestion.id}`);
    }
  }, [currentQuestion, status]);

  const formattedTimeLeft = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  const timeProgress = useMemo(() => {
    if (currentTimeLimit <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, (timeLeft / currentTimeLimit) * 100));
  }, [currentTimeLimit, timeLeft]);

  const questionProgress = useMemo(() => {
    if (totalQuestions <= 0) {
      return 0;
    }
    return Math.min(100, ((currentIndex + 1) / totalQuestions) * 100);
  }, [currentIndex, totalQuestions]);

  if (status === "limit-reached") {
    const lockedInfo = limitLockInfo ?? attemptLimit ?? initialAttemptLimit ?? null;
    const attemptsRemaining =
      lockedInfo?.remaining !== undefined && lockedInfo?.remaining !== null
        ? Math.max(lockedInfo.remaining, 0)
        : 0;
    const attemptsUsed =
      lockedInfo && lockedInfo.remaining !== null
        ? Math.max(lockedInfo.max - lockedInfo.remaining, 0)
        : lockedInfo?.max ?? null;

    return (
      <div className="mx-auto max-w-xl space-y-6 py-12">
        {lockedInfo && (
          <AttemptLimitBanner
            maxAttempts={lockedInfo.max}
            period={lockedInfo.period}
            attemptsRemaining={attemptsRemaining}
            attemptsUsed={attemptsUsed}
            resetAt={lockedInfo.resetAt}
            className="shadow-sm"
          />
        )}
        <p className="text-sm text-muted-foreground">
          You’ve reached the attempt limit for this quiz. Please wait for the reset window or
          explore other quizzes while you wait.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push(`/quizzes/${quizSlug}`)}>
            Return to quiz details
          </Button>
          <Button variant="outline" onClick={() => router.push("/quizzes")}>
            Browse other quizzes
          </Button>
        </div>
      </div>
    );
  }

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

  if (status === "redirecting") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">
          Wrapping up your results… taking you to the summary.
        </p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading your next question…</p>
      </div>
    );
  }

  // Render new UI if feature flag is enabled
  if (ENABLE_NEW_QUIZ_UI) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <QuizPlayUI
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          timeLeft={timeLeft}
          timeLimit={currentTimeLimit}
          selectedAnswerId={selectedAnswerId}
          feedback={feedback}
          isReviewing={isReviewing}
          isAdvancing={isCompleting}
          onAnswerSelect={handleAnswerSelect}
          onNext={handleNext}
          reviewTimeout={900}
          helperText="Tap an answer to lock it in"
        />
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => router.push(`/quizzes/${quizSlug}`)}>
            Quit quiz
          </Button>
        </div>
      </div>
    );
  }

  // Fallback to old UI
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{quizTitle}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-border bg-background/80 px-3 py-1 shadow-sm backdrop-blur">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Time
            </span>
            <Badge
              variant="outline"
              className={cn(
                "min-w-[64px] justify-center text-base font-semibold",
                timeLeft <= 5 && "border-red-500 text-red-600"
              )}
            >
              {formattedTimeLeft}
            </Badge>
          </div>
        </div>
        <Progress value={questionProgress} className="h-2 bg-muted/60" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {currentQuestion.questionText}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-[width] duration-200 ease-out",
                  timeLeft <= 5 && "animate-pulse"
                )}
                style={{ width: `${timeProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Keep the streak going</span>
              <span>{Math.max(timeLeft, 0)}s left</span>
            </div>
          </div>

          <div className="grid gap-3">
            {currentQuestion.answers.map((answer) => {
              const isSelected = feedback?.selectedAnswerId === answer.id;
              const isCorrectAnswer = feedback?.correctAnswerId === answer.id;
              const isIncorrectSelection =
                isSelected && !feedback?.isCorrect && !feedback?.wasSkipped;

              let statusHint: string | null = null;
              if (feedback) {
                if (isCorrectAnswer) {
                  if (feedback.wasSkipped) {
                    statusHint = "Time's up";
                  } else {
                    statusHint =
                      feedback.isCorrect && isSelected ? "You nailed it!" : "Correct answer";
                  }
                } else if (isIncorrectSelection) {
                  statusHint = "Your answer";
                }
              }

              return (
                <Button
                  key={answer.id}
                  variant="outline"
                  className={cn(
                    "justify-start text-left transition-all duration-200",
                    !feedback && "hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10",
                    feedback && "cursor-default",
                    isCorrectAnswer &&
                    "border-emerald-500/80 bg-emerald-500/10 text-foreground shadow-[0_0_0_1px_rgba(16,185,129,0.2)]",
                    isIncorrectSelection && "border-destructive/70 bg-destructive/10 text-foreground"
                  )}
                  disabled={Boolean(feedback) || pendingQuestionId === currentQuestion.id}
                  onClick={() => handleAnswer(answer.id)}
                >
                  <div className="flex w-full flex-col gap-1">
                    <span className="text-base font-medium leading-snug">{answer.answerText}</span>
                    {statusHint && (
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wide",
                          isCorrectAnswer
                            ? "text-emerald-600"
                            : isIncorrectSelection
                              ? "text-destructive"
                              : "text-muted-foreground"
                        )}
                      >
                        {statusHint}
                      </span>
                    )}
                  </div>
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
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p>{feedback.message}</p>
                  {feedback.correctAnswerText && (!feedback.isCorrect || feedback.wasSkipped) && (
                    <p>
                      The answer was{" "}
                      <span className="font-semibold text-foreground">{feedback.correctAnswerText}</span>.
                    </p>
                  )}
                  {feedback.explanation && (
                    <p className="text-xs text-muted-foreground">{feedback.explanation}</p>
                  )}
                </div>
              </AlertDescription>
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
