"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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

interface QuestionFeedback {
  isCorrect: boolean;
  wasSkipped: boolean;
  message: string;
  selectedAnswerId: string | null;
  correctAnswerId: string | null;
  correctAnswerText: string | null;
  explanation?: string | null;
}

interface QuizPlayUIProps {
  question: AttemptQuestion;
  currentIndex: number;
  totalQuestions: number;
  timeLeft: number;
  timeLimit: number;
  selectedAnswerId: string | null;
  feedback: QuestionFeedback | null;
  isReviewing: boolean;
  isAdvancing: boolean;
  onAnswerSelect: (answerId: string) => void;
  onNext: () => void;
  reviewTimeout?: number; // Configurable, default 900ms
  helperText?: string;
  className?: string;
}

type ThemeVariant = "light" | "dark";

const variantStyles: Record<ThemeVariant, {
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

export function QuizPlayUI({
  question,
  currentIndex,
  totalQuestions,
  timeLeft,
  timeLimit,
  selectedAnswerId,
  feedback,
  isReviewing,
  isAdvancing,
  onAnswerSelect,
  onNext,
  reviewTimeout = 900,
  helperText = "Tap an answer to lock it in",
  className,
}: QuizPlayUIProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Resolve theme (user preference or system)
  const resolvedTheme = useMemo(() => {
    if (!mounted) return "dark"; // Default during SSR
    return theme === "system" ? systemTheme : theme;
  }, [theme, systemTheme, mounted]);

  const currentVariant: ThemeVariant = resolvedTheme === "dark" ? "dark" : "light";
  const styles = variantStyles[currentVariant];

  useEffect(() => {
    setMounted(true);
    const timeout = window.setTimeout(() => {
      setIsVisible(true);
    }, 40);
    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  const formattedTime = formatSeconds(timeLeft);
  const questionPrompt = question.questionText;
  const correctAnswerId = question.correctAnswerId;
  const answerImageUrls = useMemo(
    () =>
      question.answers
        .map((answer) => answer.answerImageUrl)
        .filter((url): url is string => typeof url === "string" && url.length > 0),
    [question.answers]
  );

  // Calculate progress
  const rawProgress = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;
  const progressPercent = totalQuestions > 0 ? Math.max(rawProgress, 4) : 0;
  const timePercent = timeLimit > 0 ? Math.min(Math.max((timeLeft / timeLimit) * 100, 0), 100) : 100;

  // Determine answer states
  const getAnswerState = (answerId: string) => {
    if (isReviewing || feedback) {
      if (answerId === correctAnswerId) {
        return "correct";
      }
      if (answerId === feedback?.selectedAnswerId && !feedback.isCorrect) {
        return "incorrect";
      }
      return "idle";
    }
    if (answerId === selectedAnswerId) {
      return "selected";
    }
    return "idle";
  };

  const isNextDisabled = !selectedAnswerId || isAdvancing || isReviewing;
  const hasQuestionImage = Boolean(question.questionImageUrl);
  const showAnswerPreview = !hasQuestionImage && answerImageUrls.length > 0;

  // Answer media frame class
  const answerMediaFrameClass = useMemo(
    () =>
      currentVariant === "light"
        ? "border-amber-200/70 bg-white/85 shadow-[0_12px_36px_-22px_rgba(15,23,42,0.3)]"
        : "border-white/20 bg-white/10 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.55)]",
    [currentVariant]
  );

  const answerMediaBadgeClass = useMemo(
    () =>
      currentVariant === "light"
        ? "border-amber-200/70 bg-amber-50/80 text-amber-700"
        : "border-white/20 bg-white/10 text-white/80",
    [currentVariant]
  );

  const handleAnswerClick = (answerId: string) => {
    if (isAdvancing || isReviewing || feedback) return;
    if (selectedAnswerId) return; // One-way selection - cannot change once selected
    onAnswerSelect(answerId);
  };

  return (
    <div
      className={cn(
        "relative flex min-h-[560px] w-full flex-col overflow-hidden rounded-[40px] border px-4 py-6 transition-all duration-700 ease-out sm:px-6 sm:py-8",
        styles.wrapper,
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
      role="region"
      aria-label={`Quiz question ${currentIndex + 1} of ${totalQuestions}`}
    >
      <div className="pointer-events-none">
        <div className={cn("absolute -left-20 -top-24 h-64 w-64 rounded-full blur-3xl", styles.overlayA)} />
        <div className={cn("absolute bottom-12 -right-16 h-72 w-72 rounded-full blur-[140px]", styles.overlayB)} />
        <div className={cn("absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px]", styles.overlayC)} />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        {/* Progress Section */}
        <div
          className={cn(
            "mt-2 grid w-full gap-4 transition-all duration-700 ease-out sm:grid-cols-[minmax(0,1fr)_minmax(180px,220px)] sm:items-end",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] opacity-80">
              <span>
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span>{Math.round(rawProgress)}%</span>
            </div>
            <div
              className={cn("relative h-2 w-full overflow-hidden rounded-full", styles.progressTrack)}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalQuestions > 0 ? totalQuestions - 1 : 1}
              aria-valuenow={currentIndex}
              aria-label="Question progress"
              aria-describedby="question-progress-summary"
            >
              <div
                className={cn("absolute inset-y-0 left-0 rounded-full", styles.progressFill)}
                style={{
                  width: `${progressPercent}%`,
                  transition: "width 650ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
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
              aria-valuenow={Math.max(timeLeft, 0)}
              aria-label="Time remaining"
              aria-describedby="time-remaining-summary"
            >
              <div
                className={cn("absolute inset-y-0 left-0 rounded-full", styles.timeFill)}
                style={{
                  width: `${timePercent}%`,
                  transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div
          className={cn(
            "relative mt-6 flex flex-1 flex-col gap-6 rounded-[32px] px-5 py-6 transition-all duration-700 ease-out sm:px-8 sm:py-9",
            styles.card,
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="space-y-6">
            {/* Question Image - Only render if exists */}
            {hasQuestionImage && (
              <div
                className={cn(
                  "relative w-full overflow-hidden rounded-[32px] aspect-[4/3]",
                  styles.imageFrame
                )}
              >
                <Image
                  src={question.questionImageUrl!}
                  alt={questionPrompt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 460px, 100vw"
                  priority
                />
              </div>
            )}
            {!hasQuestionImage && showAnswerPreview && (
              <div
                className={cn(
                  "relative flex w-full items-center justify-center gap-4 rounded-[32px] border px-6 py-8",
                  styles.imageFrame
                )}
              >
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {answerImageUrls.slice(0, 4).map((url, index) => (
                    <div
                      key={url}
                      className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/30 bg-white/10 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.6)]"
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
            )}

            {/* Question Text - Adjust size based on image presence */}
            <div className={cn("space-y-3", hasQuestionImage ? "mt-0" : "mt-0")}>
              <p className={cn("text-xs font-semibold uppercase tracking-[0.35em]", styles.helper)}>
                {helperText}
              </p>
              <p className={cn(
                "font-semibold leading-snug",
                hasQuestionImage 
                  ? "text-2xl sm:text-3xl"  // Smaller when image present
                  : "text-3xl sm:text-4xl",  // Larger when no image
                styles.question
              )}>
                {questionPrompt}
              </p>
            </div>

            {/* Answers */}
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {question.answers.map((answer) => {
                const answerState = getAnswerState(answer.id);
                const hasAnswerMedia = Boolean(answer.answerImageUrl || answer.answerVideoUrl || answer.answerAudioUrl);
                const enableHover = !(isAdvancing || isReviewing || Boolean(feedback));

                return (
                  <button
                    key={answer.id}
                    type="button"
                    onClick={() => handleAnswerClick(answer.id)}
                    className={cn(
                      styles.answerBase,
                      "w-full justify-between gap-3",
                      answerState === "idle" && styles.answerIdle,
                      answerState === "selected" && styles.answerSelected,
                      answerState === "correct" && styles.answerCorrect,
                      answerState === "incorrect" && styles.answerIncorrect,
                      (isAdvancing || isReviewing || feedback) && styles.answerDisabled,
                      enableHover && "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-35px_rgba(15,23,42,0.45)]"
                    )}
                    disabled={isAdvancing || isReviewing || Boolean(feedback)}
                    aria-pressed={answer.id === selectedAnswerId}
                    aria-label={answer.answerText}
                  >
                    <span className="flex w-full items-center gap-3 text-left">
                      {/* Answer Media - Only show if exists */}
                      {hasAnswerMedia && (
                        <span
                          className={cn(
                            "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border",
                            answerMediaFrameClass
                          )}
                          aria-hidden="true"
                        >
                          {answer.answerImageUrl ? (
                            <Image
                              src={answer.answerImageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : answer.answerVideoUrl ? (
                            <span className="text-lg">🎬</span>
                          ) : (
                            <span className="text-lg">🔊</span>
                          )}
                        </span>
                      )}
                      <span className="text-left leading-tight">{answer.answerText}</span>
                    </span>
                    {answerState === "correct" && (
                      <span className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                        answerMediaBadgeClass
                      )}>
                        Correct
                      </span>
                    )}
                    {answerState === "incorrect" && (
                      <span className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                        answerMediaBadgeClass
                      )}>
                        Incorrect
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Button */}
          <div className="mt-auto">
            <button
              type="button"
              onClick={onNext}
              className={cn(
                "inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-lg font-semibold transition-all duration-300",
                isNextDisabled ? styles.nextDisabled : styles.nextButton,
                isAdvancing && "scale-[0.99]"
              )}
              disabled={isNextDisabled}
            >
              {isAdvancing ? "Loading" : currentIndex + 1 >= totalQuestions ? "Complete" : "Next"}
            </button>
          </div>

          {/* Feedback Message (Screen Reader) */}
          <div className="sr-only" role="status" aria-live="polite">
            {feedback?.message ?? ""}
          </div>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        <span id="question-progress-summary">
          Question {currentIndex + 1} of {totalQuestions}. {Math.round(progressPercent)} percent complete.
        </span>
        <span id="time-remaining-summary">
          {Math.max(timeLeft, 0)} seconds remaining.
        </span>
      </div>
    </div>
  );
}
