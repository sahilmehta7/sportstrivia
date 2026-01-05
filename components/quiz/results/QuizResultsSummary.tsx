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
  return (
    <div
      className={cn(
        "relative py-6 text-center",
        className
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
        <h2 className={cn("mb-4 text-xl font-bold", getTextColor("primary"))}>
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
            getAccentColor("success"),
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

export function QuizResultsStatsGrid({ data, className }: QuizResultsStatsGridProps) {
  const cards = [
    {
      label: "Longest Streak",
      icon: <Zap className={cn("h-4 w-4", getAccentColor("warning"))} />,
      value: `${data.longestStreak} correct`,
    },
    {
      label: "Avg. Response Time",
      icon: <Clock className={cn("h-4 w-4", getAccentColor("success"))} />,
      value: `${data.averageResponseTimeSeconds.toFixed(1)} sec`,
    },
    {
      label: "Total Time",
      icon: <Clock className={cn("h-4 w-4", getAccentColor("primary"))} />,
      value: formatTime(data.timeSpentSeconds),
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 gap-8 rounded-2xl bg-white/5 p-6 backdrop-blur-sm sm:grid-cols-3 sm:gap-12", className)}>
      {cards.map((card, index) => (
        <div
          key={card.label}
          className={cn(
            "flex flex-col items-center justify-center text-center",
            index !== cards.length - 1 && "relative after:absolute after:bottom-[-1.5rem] after:left-1/2 after:top-auto after:h-px after:w-full after:max-w-[12rem] after:-translate-x-1/2 after:bg-border after:content-[''] sm:after:bottom-auto sm:after:left-auto sm:after:right-[-1.5rem] sm:after:top-1/2 sm:after:h-8 sm:after:w-px sm:after:max-w-none sm:after:-translate-y-1/2 sm:after:translate-x-0 sm:after:right-[-3rem]"
          )}
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            {card.icon}
            <p className={cn("text-xs font-semibold uppercase tracking-wider opacity-70", getTextColor("primary"))}>{card.label}</p>
          </div>
          <p className={cn("text-2xl font-bold sm:text-3xl", getTextColor("primary"))}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}


