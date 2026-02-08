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
    const progressPercent = totalQuestions > 0 ? Math.max(rawProgress, 0) : 0;

    return (
        <div className="space-y-2">
            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Progression
                    </span>
                    <div className="flex items-baseline gap-1 font-mono text-sm font-bold text-white">
                        <span>{String(currentIndex + 1).padStart(2, '0')}</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-600">{String(totalQuestions).padStart(2, '0')}</span>
                    </div>
                </div>
                <div className="font-mono text-[10px] font-bold text-emerald-400">
                    {Math.round(rawProgress)}%
                </div>
            </div>
            <div className="relative h-1 w-full overflow-hidden bg-zinc-800">
                <m.div
                    className="absolute inset-y-0 left-0 bg-emerald-500"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                />
            </div>
        </div>
    );
});
