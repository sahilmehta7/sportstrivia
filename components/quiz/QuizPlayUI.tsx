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

import { variantStyles, ThemeVariant } from "./quiz-theme";
import { QuizProgress } from "./QuizProgress";
import { QuizTimer } from "./QuizTimer";
import { AnswerGrid } from "./AnswerGrid";

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

  const questionPrompt = question.questionText;
  const answerImageUrls = useMemo(
    () =>
      question.answers
        .map((answer) => answer.answerImageUrl)
        .filter((url): url is string => typeof url === "string" && url.length > 0),
    [question.answers]
  );

  const isNextDisabled = !selectedAnswerId || isAdvancing || isReviewing;
  const hasQuestionImage = Boolean(question.questionImageUrl);
  const showAnswerPreview = !hasQuestionImage && answerImageUrls.length > 0;

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
            <QuizProgress
              currentIndex={currentIndex}
              totalQuestions={totalQuestions}
              styles={styles}
            />
            <QuizTimer
              timeLeft={timeLeft}
              timeLimit={timeLimit}
              styles={styles}
              currentVariant={currentVariant}
            />
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
                      hasQuestionImage ? "text-lg sm:text-xl lg:text-2xl" : "text-xl sm:text-2xl md:text-3xl",
                      styles.question
                    )}>
                      {questionPrompt}
                    </h2>
                  </div>
                </div>

                {/* Answers Grid */}
                <AnswerGrid
                  question={question}
                  selectedAnswerId={selectedAnswerId}
                  feedback={feedback}
                  isReviewing={isReviewing}
                  isAdvancing={isAdvancing}
                  onAnswerSelect={onAnswerSelect}
                  styles={styles}
                  currentVariant={currentVariant}
                />
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
