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

const CONFETTI_COLORS = ["#10b981", "#fbbf24", "#f43f5e", "#3b82f6", "#8b5cf6"];

interface QuizResultsSummaryProps {
  data: QuizResultsSummaryData;
  theme?: ShowcaseTheme;
  confetti?: boolean;
  footer?: ReactNode;
  className?: string;
}

function formatTime(seconds: number) {
  if (!seconds || Number.isNaN(seconds)) {
    return "0s";
  }
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

export function QuizResultsSummary({ data, theme, confetti = false, footer, className }: QuizResultsSummaryProps) {
  const percentage = (data.correctAnswers / data.totalQuestions) * 100;

  let performanceLabel = "KEEP PUSHING";
  let performanceColor = "text-rose-500";

  if (percentage >= 90) {
    performanceLabel = "LEGENDARY STATUS";
    performanceColor = "text-amber-400";
  } else if (percentage >= 75) {
    performanceLabel = "PRO PERFORMANCE";
    performanceColor = "text-emerald-400";
  } else if (percentage >= 50) {
    performanceLabel = "STRONG EFFORT";
    performanceColor = "text-blue-400";
  }

  return (
    <div className={cn("relative py-8 text-center", className)}>
      {confetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, _i) => (
            <motion.div
              key={_i}
              className="absolute h-1.5 w-1.5 rounded-sm"
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
        className="relative z-10 space-y-8"
      >
        <div className="space-y-1">
          <motion.h2
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={cn("text-xl font-bold uppercase tracking-[0.2em] text-zinc-500")}
          >
            Mission Complete
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={cn("text-3xl font-black italic tracking-tighter sm:text-4xl", performanceColor)}
          >
            {performanceLabel}
          </motion.p>
        </div>

        <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
          {/* Animated background rings */}
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed border-zinc-700 opacity-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border border-dotted border-zinc-500 opacity-20"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.3 }}
            className={cn(
              "relative flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-zinc-800 bg-zinc-900 text-center shadow-2xl shadow-black/50"
            )}
          >
            <div className="text-6xl font-black text-white">{data.correctAnswers}</div>
            <div className="mt-1 h-px w-8 bg-zinc-700" />
            <div className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
              {data.totalQuestions}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-2 rounded-sm border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400"
        >
          <Clock className="h-3 w-3" />
          <span>Time: {formatTime(data.timeSpentSeconds)}</span>
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
      label: "Streak",
      icon: <Zap className="h-4 w-4 text-amber-400" />,
      value: data.longestStreak,
      unit: "MAX",
      color: "bg-zinc-900 border-zinc-800 hover:border-amber-500/50",
      accent: "text-amber-400"
    },
    {
      label: "Speed",
      icon: <Clock className="h-4 w-4 text-emerald-400" />,
      value: data.averageResponseTimeSeconds.toFixed(1),
      unit: "SEC/Q",
      color: "bg-zinc-900 border-zinc-800 hover:border-emerald-500/50",
      accent: "text-emerald-400"
    },
    {
      label: "Rating",
      icon: <Star className="h-4 w-4 text-blue-400" />,
      value: Math.round((data.correctAnswers / data.totalQuestions) * 100),
      unit: "PTS",
      color: "bg-zinc-900 border-zinc-800 hover:border-blue-500/50",
      accent: "text-blue-400"
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
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-all duration-300",
            card.color
          )}
        >
          <div className="mb-3 rounded-sm bg-zinc-800 p-2 text-white">
            {card.icon}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {card.label}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={cn("text-3xl font-black tabular-nums", card.accent)}>{card.value}</span>
            <span className="text-[10px] font-bold text-zinc-600">{card.unit}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}


