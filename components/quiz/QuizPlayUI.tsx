"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";

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

/*
  "Minimal Athletic Pro Max" Design
  - Richer gradients, deeper diffs between layers
  - Sharper borders (1px) with high contrast in dark mode
  - "Athletic" typography: tighter tracking, uppercase labels
  - Interactive tactile feel
*/
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
  answerBase: string; // Base layout
  answerIdle: string; // Default state
  answerSelected: string; // User picked this
  answerDisabled: string; // Locked state
  answerCorrect: string; // Revealed correct
  answerIncorrect: string; // Revealed wrong
  imageFrame: string;
  nextButton: string;
  nextDisabled: string;
}> = {
  light: {
    wrapper:
      "bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50 text-slate-900 shadow-2xl ring-1 ring-slate-900/5",
    overlayA: "bg-amber-300/40 mix-blend-multiply filter blur-3xl",
    overlayB: "bg-orange-300/40 mix-blend-multiply filter blur-3xl",
    overlayC: "bg-rose-300/40 mix-blend-multiply filter blur-3xl",
    card:
      "bg-white/60 backdrop-blur-2xl text-slate-900 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] ring-1 ring-white/60",
    helper: "text-slate-500 font-bold",
    question: "text-slate-900 tracking-tight",
    progressTrack: "bg-slate-200/50",
    progressFill: "bg-gradient-to-r from-amber-500 to-orange-600",
    timeLabel: "text-slate-500 font-bold",
    timeValue: "text-slate-900 tracking-tighter",
    timeTrack: "bg-slate-200/50",
    timeFill: "bg-gradient-to-r from-amber-500 to-orange-600",
    answerBase:
      "relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ease-out px-4 py-4 text-base font-bold tracking-tight shadow-sm active:scale-[0.98]",
    answerIdle:
      "border-transparent bg-white/50 text-slate-700 hover:border-amber-400/50 hover:bg-white/80",
    answerSelected:
      "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/20",
    answerDisabled: "cursor-not-allowed opacity-60",
    answerCorrect:
      "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
    answerIncorrect:
      "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/20",
    imageFrame:
      "border-2 border-white/50 bg-white/40 shadow-inner rounded-3xl",
    nextButton:
      "bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0.5",
    nextDisabled: "bg-slate-200 text-slate-400 cursor-not-allowed",
  },
  dark: {
    wrapper:
      "bg-black text-white ring-1 ring-white/10",
    // More localized, intense glows for 'Pro Max' dark feel
    overlayA: "bg-emerald-500/10 blur-[100px]",
    overlayB: "bg-indigo-500/10 blur-[100px]",
    overlayC: "bg-rose-500/10 blur-[100px]",
    card:
      "bg-[#0A0A0A]/60 backdrop-blur-3xl text-white shadow-2xl ring-1 ring-white/10",
    helper: "text-white/40 font-bold",
    question: "text-white tracking-tight drop-shadow-sm",
    progressTrack: "bg-white/5",
    progressFill: "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.4)]",
    timeLabel: "text-white/40 font-bold",
    timeValue: "text-white tracking-tighter",
    timeTrack: "bg-white/5",
    // Dynamic timer color is handled in logic, this is base
    timeFill: "bg-white",
    answerBase:
      "relative overflow-hidden rounded-2xl border lg:border-2 transition-all duration-200 ease-out px-4 py-4 text-base font-bold tracking-tight active:scale-[0.98]",
    answerIdle:
      "border-white/5 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white",
    answerSelected:
      "border-transparent bg-white text-black shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]",
    answerDisabled: "cursor-not-allowed opacity-40",
    answerCorrect:
      "border-transparent bg-emerald-500 text-black shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]",
    answerIncorrect:
      "border-transparent bg-rose-500 text-white shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)]",
    imageFrame:
      "border border-white/10 bg-white/5 shadow-2xl rounded-3xl",
    nextButton:
      "bg-white text-black shadow-[0_0_30px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_-10px_rgba(255,255,255,0.5)] hover:-translate-y-0.5 active:translate-y-0.5",
    nextDisabled: "bg-white/10 text-white/20 cursor-not-allowed",
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
  isReviewing, // Used for 'locking in' state
  isAdvancing,
  onAnswerSelect,
  onNext,
  reviewTimeout: _reviewTimeout = 900,
  helperText = "Select an option",
  className,
}: QuizPlayUIProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Resolve theme (user preference or system)
  const resolvedTheme = useMemo(() => {
    if (!mounted) return "dark"; // Default during SSR
    return theme === "system" ? systemTheme : theme;
  }, [theme, systemTheme, mounted]);

  const currentVariant: ThemeVariant = resolvedTheme === "dark" ? "dark" : "light";
  const styles = variantStyles[currentVariant];

  useEffect(() => {
    setMounted(true);
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

  // Timer urgency
  const isUrgent = timeLeft <= 5 && timeLeft > 0;

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
        ? "border-amber-200/70 bg-white/85 shadow-sm"
        : "border-white/20 bg-white/10 shadow-sm",
    [currentVariant]
  );

  const answerMediaBadgeClass = useMemo(
    () =>
      currentVariant === "light"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-white/20 text-white border-white/20 backdrop-blur-md",
    [currentVariant]
  );

  const handleAnswerClick = (answerId: string) => {
    if (isAdvancing || isReviewing || feedback) return;
    onAnswerSelect(answerId);
  };

  if (!mounted) return null;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn(
          "relative flex min-h-[500px] w-full flex-col overflow-hidden rounded-[40px] border px-4 py-4 sm:px-8 sm:py-8 lg:min-h-[600px]",
          styles.wrapper,
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Ambient Backgrounds */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className={cn("absolute -left-20 -top-24 h-96 w-96 rounded-full opacity-60", styles.overlayA)}
          />
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className={cn("absolute bottom-0 -right-20 h-[500px] w-[500px] rounded-full opacity-50", styles.overlayB)}
          />
          <m.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className={cn("absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30", styles.overlayC)}
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col gap-4 sm:gap-6">
          {/* Header: Progress & Timer */}
          <div className="grid w-full grid-cols-[1fr_auto] gap-4 items-end">
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                <span>
                  Question {currentIndex + 1} <span className="opacity-40">/ {totalQuestions}</span>
                </span>
                <span>{Math.round(rawProgress)}%</span>
              </div>
              <div
                className={cn("relative h-2 w-full overflow-hidden rounded-full", styles.progressTrack)}
              >
                <m.div
                  className={cn("absolute inset-y-0 left-0 rounded-full", styles.progressFill)}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "circOut" }}
                />
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-1.5 min-w-[100px] sm:min-w-[120px]">
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                <span className={styles.timeLabel}>Time Left</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <m.div
                  animate={isUrgent ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : {}}
                  transition={isUrgent ? { duration: 0.5, repeat: Infinity } : {}}
                  className={cn(
                    "text-2xl sm:text-3xl font-black tracking-tighter tabular-nums leading-none",
                    styles.timeValue,
                    isUrgent && "text-rose-500 font-['Barlow_Condensed',sans-serif]"
                  )}
                >
                  {formattedTime}
                </m.div>

                {/* Circular Timer Visual */}
                <div className="relative h-6 w-6 sm:h-8 sm:w-8">
                  <svg className="h-full w-full -rotate-90 text-transparent" viewBox="0 0 36 36">
                    <title>Time Remaining Circle</title>
                    {/* Background Circle */}
                    <path
                      className={isUrgent ? "stroke-rose-900/20" : "stroke-white/10"}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeWidth="4"
                    />
                    {/* Progress Circle */}
                    <m.path
                      className={isUrgent ? "stroke-rose-500" : "stroke-current"}
                      stroke={isUrgent ? undefined : "url(#gradient)"} // Use simple color or gradient
                      strokeDasharray={`${timePercent}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeWidth="4"
                      strokeLinecap="round"
                      animate={{ strokeDasharray: `${timePercent}, 100` }}
                      transition={{ duration: 0.5, ease: "linear" }}
                      style={!isUrgent && currentVariant === 'dark' ? { stroke: 'white' } : {}}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Question & Answers Area */}
          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <m.div
                key={question.id}
                initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  opacity: { duration: 0.3 }
                }}
                className={cn(
                  "flex flex-col gap-4 sm:gap-6 rounded-[32px] p-4 sm:p-6",
                  styles.card
                )}
              >
                {/* Question Content */}
                <div className="space-y-4 sm:space-y-6">
                  {hasQuestionImage && (
                    <div className={cn("relative w-full overflow-hidden aspect-video max-h-[25vh] sm:max-h-[35vh]", styles.imageFrame)}>
                      <Image
                        src={question.questionImageUrl!}
                        alt={questionPrompt}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 600px, 100vw"
                        priority
                      />
                    </div>
                  )}

                  {!hasQuestionImage && showAnswerPreview && (
                    <div className={cn("relative flex w-full flex-wrap justify-center gap-4 py-4 sm:py-8", styles.imageFrame)}>
                      {answerImageUrls.slice(0, 4).map((url, index) => (
                        <div key={index} className="relative h-16 w-16 sm:h-24 sm:w-24 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                          <Image src={url} alt={`Option ${index + 1}`} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 sm:space-y-4">
                    <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] font-['Barlow_Condensed',sans-serif]", styles.helper)}>
                      {helperText}
                    </p>
                    <h2 className={cn(
                      "font-bold leading-tight uppercase tracking-tighter font-['Barlow_Condensed',sans-serif]",
                      hasQuestionImage ? "text-xl sm:text-2xl lg:text-3xl" : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl",
                      styles.question
                    )}>
                      {questionPrompt}
                    </h2>
                  </div>
                </div>

                {/* Answers Grid */}
                <div className="grid w-full gap-3 sm:gap-4 sm:grid-cols-2">
                  {question.answers.map((answer, i) => {
                    const answerState = getAnswerState(answer.id);
                    const hasAnswerMedia = Boolean(answer.answerImageUrl || answer.answerVideoUrl || answer.answerAudioUrl);
                    const enableHover = !(isAdvancing || isReviewing || Boolean(feedback));

                    return (
                      <m.button
                        key={answer.id}
                        layoutId={`answer-${answer.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleAnswerClick(answer.id)}
                        whileHover={enableHover ? { scale: 1.02, y: -2 } : {}}
                        whileTap={enableHover ? { scale: 0.98 } : {}}
                        disabled={isAdvancing || isReviewing || Boolean(feedback)}
                        className={cn(
                          styles.answerBase,
                          "flex flex-col justify-center gap-2 text-left min-h-[60px] sm:min-h-[72px]",
                          answerState === "idle" && styles.answerIdle,
                          answerState === "selected" && styles.answerSelected,
                          answerState === "correct" && styles.answerCorrect,
                          answerState === "incorrect" && styles.answerIncorrect,
                          (isAdvancing || isReviewing || feedback) && styles.answerDisabled
                        )}
                      >
                        <div className="flex w-full items-center gap-3 sm:gap-4">
                          {hasAnswerMedia && (
                            <div className={cn("relative h-10 w-10 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border", answerMediaFrameClass)}>
                              {answer.answerImageUrl ? (
                                <Image src={answer.answerImageUrl} alt="" fill className="object-cover" />
                              ) : <span className="flex h-full w-full items-center justify-center text-xl">📷</span>}
                            </div>
                          )}
                          <span className="text-sm sm:text-base lg:text-lg leading-snug">{answer.answerText}</span>
                        </div>

                        {/* Status Badge */}
                        {answerState === "correct" && (
                          <m.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn("absolute top-3 right-3 rounded-full border px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest", answerMediaBadgeClass)}
                          >
                            Correct
                          </m.div>
                        )}
                      </m.button>
                    );
                  })}
                </div>
              </m.div>
            </AnimatePresence>
          </div>

          {/* Footer / Next Button */}
          <div className="flex justify-end pt-2">
            <m.button
              onClick={onNext}
              disabled={isNextDisabled}
              whileHover={!isNextDisabled ? { scale: 1.05 } : {}}
              whileTap={!isNextDisabled ? { scale: 0.95 } : {}}
              animate={isNextDisabled ? { opacity: 0.5 } : { opacity: 1 }}
              className={cn(
                "relative overflow-hidden rounded-full px-10 py-4 text-lg font-bold tracking-wide transition-colors",
                isNextDisabled ? styles.nextDisabled : styles.nextButton
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isAdvancing ? "Processing..." : currentIndex + 1 >= totalQuestions ? "Finish Quiz" : "Next Question"}
                {!isAdvancing && currentIndex + 1 < totalQuestions && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                )}
              </span>
            </m.button>
          </div>
        </div>
      </m.div>
    </LazyMotion>
  );
}
