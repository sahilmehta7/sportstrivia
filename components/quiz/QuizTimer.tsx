import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatSeconds, variantStyles, ThemeVariant } from "./quiz-theme";

type QuizStyles = typeof variantStyles["light"];

interface QuizTimerProps {
    timeLeft: number;
    timeLimit: number;
    styles: QuizStyles;
    currentVariant: ThemeVariant;
}

export function QuizTimer({ timeLeft, timeLimit, styles, currentVariant }: QuizTimerProps) {
    const formattedTime = formatSeconds(timeLeft);
    const timePercent = timeLimit > 0 ? Math.min(Math.max((timeLeft / timeLimit) * 100, 0), 100) : 100;

    // Timer urgency
    const isUrgent = timeLeft <= 5 && timeLeft > 0;

    return (
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
    );
}
