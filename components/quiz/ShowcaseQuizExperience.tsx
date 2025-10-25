"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ShowcaseQuizExperienceAnswer {
  id: string;
  text: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  isCorrect?: boolean;
}

export interface ShowcaseQuizExperienceQuestion {
  id: string;
  prompt: string;
  imageUrl?: string | null;
  timeRemaining?: number | null;
  timeLimit?: number | null;
  answers: ShowcaseQuizExperienceAnswer[];
  correctAnswerId?: string | null;
}

type ShowcaseVariant = "light" | "dark";

interface ShowcaseQuizExperienceProps {
  variant?: ShowcaseVariant;
  questions: ShowcaseQuizExperienceQuestion[];
  className?: string;
  helperText?: string;
}

const variantStyles: Record<ShowcaseVariant, {
  wrapper: string;
  overlayA: string;
  overlayB: string;
  overlayC: string;
  card: string;
  helper: string;
  question: string;
  progressTrack: string;
  progressFill: string;
  timeLabel: string;
  timeValue: string;
  timeTrack: string;
  timeFill: string;
  answerBase: string;
  answerIdle: string;
  answerSelected: string;
  answerDisabled: string;
  answerCorrect: string;
  answerIncorrect: string;
  imageFrame: string;
  nextButton: string;
  nextDisabled: string;
}> = {
  light: {
    wrapper:
      "bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 text-slate-900 border-white/50 shadow-[0_36px_96px_-50px_rgba(251,191,36,0.45)]",
    overlayA: "bg-amber-200/60",
    overlayB: "bg-orange-200/45",
    overlayC: "bg-white/55",
    card:
      "bg-white/85 text-slate-900 shadow-[0_28px_88px_-54px_rgba(15,23,42,0.4)]",
    helper: "text-slate-600",
    question: "text-slate-900",
    progressTrack: "bg-white/70",
    progressFill: "bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400",
    timeLabel: "text-slate-600",
    timeValue: "text-slate-900",
    timeTrack: "bg-white/60",
    timeFill: "bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400",
    answerBase:
      "rounded-full border transition-all duration-300 ease-out px-5 py-3 text-base font-semibold shadow-[0_18px_48px_-30px_rgba(15,23,42,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400",
    answerIdle:
      "border-amber-200/70 bg-white/85 text-slate-900 hover:border-amber-300 hover:bg-amber-50/80",
    answerSelected:
      "border-transparent bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 text-slate-900 shadow-[0_28px_60px_-30px_rgba(245,158,11,0.65)]",
    answerDisabled: "pointer-events-none opacity-60",
    answerCorrect:
      "border-emerald-300 bg-emerald-100/90 text-emerald-900 shadow-[0_26px_60px_-36px_rgba(16,185,129,0.4)]",
    answerIncorrect:
      "border-rose-300 bg-rose-50 text-rose-700 shadow-[0_18px_48px_-34px_rgba(244,63,94,0.35)]",
    imageFrame:
      "border border-white/50 bg-white/70 shadow-[0_32px_110px_-70px_rgba(15,23,42,0.4)]",
    nextButton:
      "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.55)]",
    nextDisabled: "bg-slate-400/40 text-slate-600/70 cursor-not-allowed",
  },
  dark: {
    wrapper:
      "bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white border-white/12 shadow-[0_52px_140px_-64px_rgba(6,182,212,0.45)]",
    overlayA: "bg-emerald-500/20",
    overlayB: "bg-cyan-500/15",
    overlayC: "bg-purple-500/20",
    card:
      "bg-white/[0.08] text-white shadow-[0_60px_160px_-80px_rgba(6,182,212,0.4)] backdrop-blur-xl",
    helper: "text-white/70",
    question: "text-white",
    progressTrack: "bg-white/12",
    progressFill: "bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400",
    timeLabel: "text-white/65",
    timeValue: "text-white",
    timeTrack: "bg-white/15",
    timeFill: "bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400",
    answerBase:
      "rounded-full border transition-all duration-300 ease-out px-5 py-3 text-base font-semibold shadow-[0_20px_60px_-36px_rgba(15,23,42,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-emerald-400/70",
    answerIdle:
      "border-white/20 bg-white/5 text-white/90 hover:border-emerald-400/60 hover:bg-emerald-400/10",
    answerSelected:
      "border-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 text-slate-950 shadow-[0_32px_80px_-36px_rgba(6,182,212,0.6)]",
    answerDisabled: "pointer-events-none opacity-50",
    answerCorrect:
      "border-emerald-400 bg-emerald-400/15 text-emerald-200 shadow-[0_24px_70px_-38px_rgba(16,185,129,0.45)]",
    answerIncorrect:
      "border-rose-400/70 bg-rose-500/15 text-rose-200 shadow-[0_20px_60px_-40px_rgba(248,113,113,0.45)]",
    imageFrame:
      "border border-white/15 bg-white/10 shadow-[0_40px_140px_-80px_rgba(6,182,212,0.45)] backdrop-blur",
    nextButton:
      "bg-white text-slate-900 hover:bg-slate-200/90 shadow-[0_30px_90px_-50px_rgba(6,182,212,0.5)]",
    nextDisabled: "bg-white/15 text-white/40 cursor-not-allowed",
  },
};

function formatSeconds(totalSeconds: number) {
  const clamped = Number.isFinite(totalSeconds) ? Math.max(totalSeconds, 0) : 0;
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function ShowcaseQuizExperience({
  variant = "dark",
  helperText = "Tap an answer to lock it in",
  questions,
  className,
}: ShowcaseQuizExperienceProps) {
  const styles = variantStyles[variant];
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const reviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalQuestions = questions.length;
  const currentQuestion = questions[activeIndex];

  useEffect(() => {
    return () => {
      if (reviewTimeoutRef.current) {
        window.clearTimeout(reviewTimeoutRef.current);
        reviewTimeoutRef.current = null;
      }
    };
  }, []);

  const timeLimit = useMemo(() => {
    if (!currentQuestion) {
      return 0;
    }
    if (typeof currentQuestion.timeLimit === "number" && currentQuestion.timeLimit > 0) {
      return currentQuestion.timeLimit;
    }
    if (typeof currentQuestion.timeRemaining === "number" && currentQuestion.timeRemaining > 0) {
      return Math.max(currentQuestion.timeRemaining, 1);
    }
    return 5 * 60;
  }, [currentQuestion]);

  const timeRemaining = useMemo(() => {
    if (!currentQuestion) {
      return 0;
    }
    if (typeof currentQuestion.timeRemaining === "number") {
      return Math.min(Math.max(currentQuestion.timeRemaining, 0), Math.max(timeLimit, 1));
    }
    return timeLimit;
  }, [currentQuestion, timeLimit]);

  const formattedTime = formatSeconds(timeRemaining);

  const questionPrompt = currentQuestion?.prompt ?? "";
  const correctAnswerId = useMemo(() => {
    if (!currentQuestion) {
      return null;
    }
    if (currentQuestion.correctAnswerId) {
      return currentQuestion.correctAnswerId;
    }
    const flagged = currentQuestion.answers.find((answer) => answer.isCorrect);
    if (flagged) {
      return flagged.id;
    }
    return currentQuestion.answers[0]?.id ?? null;
  }, [currentQuestion]);

  const correctAnswerText = useMemo(() => {
    if (!currentQuestion || !correctAnswerId) {
      return null;
    }
    return (
      currentQuestion.answers.find((answer) => answer.id === correctAnswerId)?.text ?? null
    );
  }, [correctAnswerId, currentQuestion]);

  const answerImageUrls = useMemo(() => {
    if (!currentQuestion) {
      return [] as string[];
    }
    return currentQuestion.answers
      .map((answer) => answer.imageUrl)
      .filter((url): url is string => typeof url === "string" && url.length > 0);
  }, [currentQuestion]);

  const hasQuestionImage = Boolean(currentQuestion?.imageUrl);
  const showAnswerPreview = !hasQuestionImage && answerImageUrls.length > 0;

  const rawProgress = totalQuestions > 0 ? (activeIndex / totalQuestions) * 100 : 0;
  const progressPercent = totalQuestions > 0 ? Math.max(rawProgress, 4) : 0;
  const timePercent = timeLimit > 0 ? Math.min(Math.max((timeRemaining / timeLimit) * 100, 0), 100) : 100;

  useEffect(() => {
    setFeedbackMessage(null);
    setIsReviewing(false);
    setIsAdvancing(false);
  }, [currentQuestion?.id]);

  const handleSelect = (answerId: string) => {
    if (isAdvancing || isReviewing) return;
    setSelectedAnswerId((prev) => (prev === answerId ? null : answerId));
  };

  const handleNext = () => {
    if (!selectedAnswerId) return;
    if (!currentQuestion) return;

    const isSelectionCorrect = selectedAnswerId === correctAnswerId;
    const feedback = isSelectionCorrect
      ? "Nice! That's correct."
      : correctAnswerText
      ? `Correct answer: ${correctAnswerText}`
      : "Revealing the correct answer...";

    setFeedbackMessage(feedback);
    setIsReviewing(true);
    setIsAdvancing(true);

    if (reviewTimeoutRef.current) {
      window.clearTimeout(reviewTimeoutRef.current);
    }

    reviewTimeoutRef.current = window.setTimeout(() => {
      if (totalQuestions <= 1) {
        setSelectedAnswerId(null);
      } else {
        setActiveIndex((prev) => (prev + 1) % totalQuestions);
        setSelectedAnswerId(null);
      }
      setIsReviewing(false);
      setIsAdvancing(false);
      setFeedbackMessage(null);
      reviewTimeoutRef.current = null;
    }, 900);
  };

  if (!currentQuestion) {
    return (
      <div
        className={cn(
          "flex min-h-[540px] flex-col items-center justify-center rounded-[48px] border border-dashed border-white/20 bg-slate-900/40 p-12 text-center text-white/60",
          className
        )}
      >
        <p>No quiz questions available right now.</p>
      </div>
    );
  }

  const isNextDisabled = !selectedAnswerId || isAdvancing || isReviewing;

  return (
    <div
      className={cn(
        "relative flex min-h-[560px] w-full flex-col overflow-hidden rounded-[40px] border px-4 py-6 transition-all duration-500 sm:px-6 sm:py-8",
        styles.wrapper,
        className
      )}
    >
      <div className="pointer-events-none">
        <div className={cn("absolute -left-20 -top-24 h-64 w-64 rounded-full blur-3xl", styles.overlayA)} />
        <div className={cn("absolute bottom-12 -right-16 h-72 w-72 rounded-full blur-[140px]", styles.overlayB)} />
        <div className={cn("absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px]", styles.overlayC)} />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mt-2 grid w-full gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(180px,220px)] sm:items-end">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] opacity-80">
              <span>
                Question {activeIndex + 1} of {totalQuestions}
              </span>
              <span>{Math.round(rawProgress)}%</span>
            </div>
            <div
              className={cn("relative h-2 w-full overflow-hidden rounded-full", styles.progressTrack)}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalQuestions > 0 ? totalQuestions - 1 : 1}
              aria-valuenow={activeIndex}
              aria-label="Question progress"
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out",
                  styles.progressFill
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.35em]">
              <span className={styles.timeLabel}>Time left</span>
              <span className={cn("text-base font-black tracking-tight", styles.timeValue)}>
                {formattedTime}
              </span>
            </div>
            <div
              className={cn("relative h-2 overflow-hidden rounded-full", styles.timeTrack)}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={Math.max(timeLimit, 1)}
              aria-valuenow={Math.max(timeRemaining, 0)}
              aria-label="Time remaining"
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out",
                  styles.timeFill
                )}
                style={{ width: `${timePercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className={cn("relative mt-6 flex flex-1 flex-col gap-6 rounded-[32px] px-5 py-6 sm:px-8 sm:py-9", styles.card)}>
          <div className="space-y-6">
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-[32px]",
                currentQuestion.imageUrl ? "aspect-[4/3]" : "aspect-square",
                styles.imageFrame
              )}
            >
              {currentQuestion.imageUrl ? (
                <Image
                  src={currentQuestion.imageUrl}
                  alt={currentQuestion.prompt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 460px, 100vw"
                  priority
                />
              ) : showAnswerPreview ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-4">
                    {answerImageUrls.slice(0, 3).map((url, index) => (
                      <div
                        key={url}
                        className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/50 bg-white/20 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.6)]"
                      >
                        <Image
                          src={url}
                          alt={`Answer option preview ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white/20 via-transparent to-white/5 text-center">
                  <span className="rounded-full bg-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                    Preview Mode
                  </span>
                  <span className="text-sm font-semibold tracking-wide text-white/70">
                    Media not provided
                  </span>
                  <span className="text-2xl" aria-hidden="true">
                    🧠
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className={cn("text-xs font-semibold uppercase tracking-[0.35em]", styles.helper)}>
                {helperText}
              </p>
              <p className={cn("text-2xl font-semibold leading-snug sm:text-3xl", styles.question)}>
                {questionPrompt}
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2">
              {(() => {
                const mediaFrameClass =
                  variant === "light"
                    ? "border-amber-200/70 bg-white/85 shadow-[0_12px_36px_-22px_rgba(15,23,42,0.3)]"
                    : "border-white/20 bg-white/10 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.55)]";
                const mediaBadgeClass =
                  variant === "light"
                    ? "border-amber-200/70 bg-amber-50/80 text-amber-700"
                    : "border-white/20 bg-white/10 text-white/80";

              {currentQuestion.answers.map((answer) => {
                const isSelected = answer.id === selectedAnswerId;
                const isCorrect = answer.id === correctAnswerId || answer.isCorrect === true;
                const answerState = (() => {
                  if (isReviewing) {
                    if (isCorrect) {
                      return "correct";
                    }
                    if (isSelected && !isCorrect) {
                      return "incorrect";
                    }
                    return "idle";
                  }
                  if (isSelected) {
                    return "selected";
                  }
                  return "idle";
                })();

                return (
                  <button
                    key={answer.id}
                    type="button"
                    onClick={() => handleSelect(answer.id)}
                    className={cn(
                      styles.answerBase,
                      "w-full justify-between gap-3",
                      answerState === "idle" && styles.answerIdle,
                      answerState === "selected" && styles.answerSelected,
                      answerState === "correct" && styles.answerCorrect,
                      answerState === "incorrect" && styles.answerIncorrect,
                      (isAdvancing || isReviewing) && styles.answerDisabled
                    )}
                    disabled={isAdvancing || isReviewing}
                    aria-pressed={isSelected}
                    aria-label={answer.text}
                  >
                    <span className="flex w-full items-center gap-3 text-left">
                      {(answer.imageUrl || answer.videoUrl || answer.audioUrl) && (
                        <span
                          className={cn(
                            "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border",
                            answer.imageUrl ? "" : "text-base",
                            mediaFrameClass
                          )}
                          aria-hidden="true"
                        >
                          {answer.imageUrl ? (
                            <Image
                              src={answer.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : answer.videoUrl ? (
                            <span className="text-lg">🎬</span>
                          ) : (
                            <span className="text-lg">🔊</span>
                          )}
                        </span>
                      )}
                      <span className="text-left leading-tight">{answer.text}</span>
                    </span>
                    {answerState === "correct" && (
                      <span className={cn("text-xs font-semibold uppercase tracking-[0.3em]", mediaBadgeClass, "rounded-full border px-3 py-1")}>Correct</span>
                    )}
                    {answerState === "incorrect" && (
                      <span className={cn("text-xs font-semibold uppercase tracking-[0.3em]", mediaBadgeClass, "rounded-full border px-3 py-1")}>Incorrect</span>
                    )}
                  </button>
                );
              })}
              })()}
            </div>
          </div>

          <div className="mt-auto">
            <button
              type="button"
              onClick={handleNext}
              className={cn(
                "inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-lg font-semibold transition-all duration-300",
                isNextDisabled ? styles.nextDisabled : styles.nextButton,
                isAdvancing && "scale-[0.99]"
              )}
              disabled={isNextDisabled}
            >
              {isAdvancing ? "Loading" : totalQuestions > 1 ? "Next" : "Retry"}
            </button>
          </div>
          <div className="sr-only" role="status" aria-live="polite">
            {feedbackMessage ?? ""}
          </div>
        </div>
      </div>
    </div>
  );
}
