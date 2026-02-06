import { memo } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { variantStyles } from "./quiz-theme";

type QuizStyles = typeof variantStyles["light"];

interface QuizProgressProps {
    currentIndex: number;
    totalQuestions: number;
    styles: QuizStyles;
}

export const QuizProgress = memo(function QuizProgress({ currentIndex, totalQuestions, styles }: QuizProgressProps) {
    const rawProgress = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;
    const progressPercent = totalQuestions > 0 ? Math.max(rawProgress, 4) : 0;

    return (
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
    );
});
