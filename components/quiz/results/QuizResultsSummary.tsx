"use client";

import type { ReactNode } from "react";
import { Clock, Zap, Star, Trophy, Target } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getTextColor,
} from "@/lib/showcase-theme";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import type { QuizResultsSummaryData } from "./types";

const CONFETTI_COLORS = ["#ef4444", "#22c55e", "#eab308", "#3b82f6", "#a855f7", "#ec4899"];

interface QuizResultsSummaryProps {
  data: QuizResultsSummaryData;
  theme?: ShowcaseTheme;
  confetti?: boolean;
  footer?: ReactNode;
  className?: string;
}

function formatTime(seconds: number) {
  if (!seconds || Number.isNaN(seconds)) {
    return "0 sec";
  }
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }
  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }
  return `${minutes} min ${remainingSeconds} sec`;
}

export function QuizResultsSummary({ data, theme, confetti = false, footer, className }: QuizResultsSummaryProps) {
  const percentage = (data.correctAnswers / data.totalQuestions) * 100;

  let performanceLabel = "Keep Practicing!";
  let performanceColor = "text-rose-500";

  if (percentage >= 90) {
    performanceLabel = "Legendary Performance!";
    performanceColor = "text-amber-500";
  } else if (percentage >= 75) {
    performanceLabel = "Pro Status!";
    performanceColor = "text-emerald-500";
  } else if (percentage >= 50) {
    performanceLabel = "Great Effort!";
    performanceColor = "text-blue-500";
  }

  return (
    <div className={cn("relative py-8 text-center", className)}>
      {confetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, _i) => (
            <motion.div
              key={_i}
              className="absolute h-2 w-2 rounded-full"
              initial={{
                top: "50%",
                left: "50%",
                opacity: 1,
                scale: 0
              }}
              animate={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0,
                scale: Math.random() * 2 + 1,
                rotate: Math.random() * 360
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                ease: "easeOut",
                delay: Math.random() * 0.5
              }}
              style={{ backgroundColor: CONFETTI_COLORS[_i % CONFETTI_COLORS.length] }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 space-y-6"
      >
        <div className="space-y-2">
          <motion.h2
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={cn("text-2xl font-black uppercase tracking-tighter sm:text-4xl", getTextColor("primary"))}
          >
            Quiz Complete
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={cn("text-lg font-bold italic", performanceColor)}
          >
            {performanceLabel}
          </motion.p>
        </div>

        <div className="relative mx-auto flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
          {/* Animated background rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-dashed border-primary/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-dotted border-primary/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.3 }}
            className={cn(
              "relative flex h-32 w-32 flex-col items-center justify-center rounded-full text-center shadow-2xl sm:h-36 sm:w-36",
              theme === "light"
                ? "bg-primary text-primary-foreground"
                : "bg-white text-black",
            )}
          >
            <div className="text-4xl font-black sm:text-5xl">{data.correctAnswers}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
              Out of {data.totalQuestions}
            </div>
          </motion.div>

          {/* Floating icons */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-2 top-4 rounded-full bg-amber-400 p-2 text-black shadow-lg"
          >
            <Trophy className="h-5 w-5" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 bottom-8 rounded-full bg-blue-500 p-2 text-white shadow-lg"
          >
            <Target className="h-5 w-5" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-sm font-medium"
        >
          <Clock className="h-4 w-4 text-primary" />
          <span>Finished in {formatTime(data.timeSpentSeconds)}</span>
        </motion.div>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </motion.div>
    </div>
  );
}

interface QuizResultsStatsGridProps {
  data: QuizResultsSummaryData;
  theme?: ShowcaseTheme;
  className?: string;
}

export function QuizResultsStatsGrid({ data, className }: QuizResultsStatsGridProps) {
  const cards = [
    {
      label: "Best Streak",
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      value: data.longestStreak,
      unit: "Questions",
      color: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Avg Speed",
      icon: <Clock className="h-4 w-4 text-emerald-500" />,
      value: data.averageResponseTimeSeconds.toFixed(1),
      unit: "Sec / Quest",
      color: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "IQ Rank",
      icon: <Star className="h-4 w-4 text-blue-500" />,
      value: Math.round((data.correctAnswers / data.totalQuestions) * 150),
      unit: "Estimated",
      color: "bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-3", className)}>
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          whileHover={{ y: -5 }}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border p-6 text-center transition-colors",
            card.color
          )}
        >
          <div className="mb-2 rounded-full bg-white p-2 shadow-sm dark:bg-white/10">
            {card.icon}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
            {card.label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black">{card.value}</span>
            <span className="text-[10px] font-bold opacity-40">{card.unit}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}


