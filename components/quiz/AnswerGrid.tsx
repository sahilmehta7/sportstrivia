import { useMemo, memo } from "react";
import Image from "next/image";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { variantStyles, ThemeVariant } from "./quiz-theme";

type QuizStyles = typeof variantStyles["light"];

interface AttemptQuestion {
    id: string;
    correctAnswerId?: string | null;
    answers: {
        id: string;
        answerText: string;
        answerImageUrl?: string | null;
        answerVideoUrl?: string | null;
        answerAudioUrl?: string | null;
    }[];
}

interface QuestionFeedback {
    isCorrect: boolean | null;
    selectedAnswerId: string | null;
}

interface AnswerGridProps {
    question: AttemptQuestion;
    selectedAnswerId: string | null;
    feedback: QuestionFeedback | null;
    isReviewing: boolean;
    isAdvancing: boolean;
    onAnswerSelect: (answerId: string) => void;
    styles: QuizStyles;
    currentVariant: ThemeVariant;
}

export const AnswerGrid = memo(function AnswerGrid({
    question,
    selectedAnswerId,
    feedback,
    isReviewing,
    isAdvancing,
    onAnswerSelect,
    styles,
    currentVariant,
}: AnswerGridProps) {
    // Determine answer states
    const getAnswerState = (answerId: string) => {
        if (isReviewing || feedback) {
            if (answerId === question.correctAnswerId) {
                return "correct";
            }
            if (answerId === feedback?.selectedAnswerId && feedback.isCorrect === false) {
                return "incorrect";
            }
            return "idle";
        }
        if (answerId === selectedAnswerId) {
            return "selected";
        }
        return "idle";
    };

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

    return (
        <div className="grid w-full gap-3 sm:gap-4 sm:grid-cols-2">
            {question.answers.map((answer, i) => {
                const answerState = getAnswerState(answer.id);
                const hasAnswerMedia = Boolean(
                    answer.answerImageUrl || answer.answerVideoUrl || answer.answerAudioUrl
                );
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
                                <div
                                    className={cn(
                                        "relative h-10 w-10 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border",
                                        answerMediaFrameClass
                                    )}
                                >
                                    {answer.answerImageUrl ? (
                                        <Image
                                            src={answer.answerImageUrl}
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-xl">
                                            📷
                                        </span>
                                    )}
                                </div>
                            )}
                            <span className="text-xs sm:text-sm lg:text-base leading-snug">
                                {answer.answerText}
                            </span>
                        </div>

                        {/* Status Badge */}
                        {answerState === "correct" && (
                            <m.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "absolute top-3 right-3 rounded-full border px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest",
                                    answerMediaBadgeClass
                                )}
                            >
                                Correct
                            </m.div>
                        )}
                    </m.button>
                );
            })}
        </div>
    );
});
