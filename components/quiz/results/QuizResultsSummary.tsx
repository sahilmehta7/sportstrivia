import type { ReactNode } from "react";
import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAccentColor,
  getTextColor,
} from "@/lib/showcase-theme";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import type { QuizResultsSummaryData } from "./types";

const CONFETTI_PARTICLES = [
  { className: "top-4 left-8", color: "bg-red-500", delay: "0s" },
  { className: "top-6 right-12", color: "bg-green-500", delay: "0.2s" },
  { className: "top-8 left-16", color: "bg-yellow-500", delay: "0.4s" },
  { className: "top-10 right-8", color: "bg-blue-500", delay: "0.6s" },
  { className: "top-12 left-12", color: "bg-purple-500", delay: "0.8s" },
];

interface QuizResultsSummaryProps {
  data: QuizResultsSummaryData;
  theme?: ShowcaseTheme;
  confetti?: boolean;
  footer?: ReactNode;
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

export function QuizResultsSummary({ data, theme, confetti = false, footer }: QuizResultsSummaryProps) {
  return (
    <div
      className={cn(
        "relative rounded-[1.5rem] p-6",
        theme === "light"
          ? "bg-gradient-to-br from-blue-50/60 to-purple-50/60"
          : "bg-white/5",
      )}
    >
      {confetti ? (
        <div className="pointer-events-none absolute inset-0">
          {CONFETTI_PARTICLES.map((particle) => (
            <div
              key={particle.delay}
              className={cn(
                "absolute h-2 w-2 rounded-full animate-bounce",
                particle.className,
                particle.color,
              )}
              style={{ animationDelay: particle.delay }}
            />
          ))}
        </div>
      ) : null}

      <div className="relative text-center">
        <h2 className={cn("mb-4 text-xl font-bold", getTextColor(theme, "primary"))}>
          Congratulations! You have scored
        </h2>

        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full shadow-lg">
          <div
            className={cn(
              "flex h-full w-full flex-col items-center justify-center rounded-full text-center",
              theme === "light"
                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-blue-500/25"
                : "bg-gradient-to-br from-amber-400 to-pink-500 shadow-pink-500/25",
            )}
          >
            <div className="text-2xl font-bold">{data.correctAnswers}</div>
            <div className="text-xs">Out of {data.totalQuestions}</div>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-center gap-2 text-sm",
            getAccentColor(theme, "success"),
          )}
        >
          <Clock className="h-4 w-4" />
          <span>You took {formatTime(data.timeSpentSeconds)} to complete the quiz</span>
        </div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}

interface QuizResultsStatsGridProps {
  data: QuizResultsSummaryData;
  theme?: ShowcaseTheme;
  className?: string;
}

export function QuizResultsStatsGrid({ data, theme, className }: QuizResultsStatsGridProps) {
  const cards = [
    {
      label: "Longest Streak",
      icon: <Zap className={cn("h-4 w-4", getAccentColor(theme, "warning"))} />,
      value: `${data.longestStreak} correct`,
    },
    {
      label: "Avg. Response Time",
      icon: <Clock className={cn("h-4 w-4", getAccentColor(theme, "success"))} />,
      value: `${data.averageResponseTimeSeconds.toFixed(1)} sec`,
    },
    {
      label: "Total Time",
      icon: <Clock className={cn("h-4 w-4", getAccentColor(theme, "primary"))} />,
      value: formatTime(data.timeSpentSeconds),
    },
  ];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "rounded-2xl border p-4 backdrop-blur-sm",
            getTextColor(theme, "primary"),
            theme === "light"
              ? "border-slate-200/50 bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]"
              : "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            {card.icon}
            <p className={cn("text-sm font-semibold", getTextColor(theme, "primary"))}>{card.label}</p>
          </div>
          <p className={cn("text-2xl font-bold", getTextColor(theme, "primary"))}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}


