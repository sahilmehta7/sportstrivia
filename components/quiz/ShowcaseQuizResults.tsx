 "use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, RotateCcw, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/services/leaderboard.service";
import { useShareResults } from "./ShareResults";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import {
  QuizResultsCard,
  QuizResultsHeader,
  QuizResultsSummary,
  QuizResultsStatsGrid,
  QuizResultsSection,
  QuizResultsLeaderboard,
  QuizResultsActions,
} from "@/components/quiz/results";

interface QuizAttempt {
  id: string;
  score: number | null;
  totalQuestions: number;
  correctAnswers: number | null;
  totalPoints: number | null;
  longestStreak: number | null;
  averageResponseTime: number | null;
  totalTimeSpent: number | null;
  passed: boolean | null;
  completedAt: Date | null;
  quiz: {
    id: string;
    title: string;
    slug: string;
    passingScore: number;
  };
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  userAnswers: Array<{
    id: string;
    isCorrect: boolean | null;
    wasSkipped: boolean | null;
    totalPoints: number | null;
    question: {
      id: string;
      questionText: string;
      explanation: string | null;
    };
    answer: {
      id: string;
      answerText: string;
    } | null;
  }>;
}

interface ShowcaseQuizResultsProps {
  attempt: QuizAttempt | null;
  leaderboardData: LeaderboardEntry[];
}

export function ShowcaseQuizResults({ attempt, leaderboardData }: ShowcaseQuizResultsProps) {
  const { theme, toggleTheme } = useShowcaseTheme();
  const [showConfetti] = useState(true);

  const results = useMemo(() => {
    if (!attempt) {
      return {
        score: 73.3,
        totalQuestions: 15,
        correctAnswers: 11,
        totalPoints: 80,
        timeSpent: 719,
        passed: true,
        longestStreak: 5,
        averageResponseTime: 2.1,
        quizTitle: "Sample Quiz",
        userName: "Demo User",
        userImage: null,
        userId: "demo",
      };
    }

    return {
      score: attempt.score || 0,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers || 0,
      totalPoints: attempt.totalPoints || 0,
      timeSpent: attempt.totalTimeSpent || 0,
      passed: attempt.passed || false,
      longestStreak: attempt.longestStreak || 0,
      averageResponseTime: attempt.averageResponseTime || 0,
      quizTitle: attempt.quiz.title,
      userName: attempt.user.name || "Anonymous",
      userImage: attempt.user.image,
      userId: attempt.user.id,
    };
  }, [attempt]);

  const leaderboardEntries = useMemo(() => {
    if (!attempt) {
      return leaderboardData.slice(0, 3);
    }

    const userPosition = leaderboardData.findIndex((entry) => entry.userId === attempt.user.id);
    const isUserInTop3 = userPosition >= 0 && userPosition < 3;

    if (isUserInTop3) {
      return leaderboardData.slice(0, 3);
    }

    if (userPosition >= 0) {
      return [...leaderboardData.slice(0, 3), leaderboardData[userPosition]];
    }

    return leaderboardData.slice(0, 3);
  }, [attempt, leaderboardData]);

  const summaryData = useMemo(
    () => ({
      quizTitle: results.quizTitle,
      userName: results.userName,
      userImage: results.userImage,
      correctAnswers: results.correctAnswers,
      totalQuestions: results.totalQuestions,
      totalPoints: results.totalPoints,
      timeSpentSeconds: results.timeSpent,
      passed: results.passed,
      longestStreak: results.longestStreak,
      averageResponseTimeSeconds:
        typeof results.averageResponseTime === "number"
          ? results.averageResponseTime
          : Number(results.averageResponseTime ?? 0),
    }),
    [results],
  );

  const { shareResults, isGenerating } = useShareResults({
    quizTitle: results.quizTitle,
    userName: results.userName,
    score: results.score,
    correctAnswers: results.correctAnswers,
    totalQuestions: results.totalQuestions,
    totalPoints: results.totalPoints,
    timeSpent: results.timeSpent,
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Button onClick={toggleTheme} variant="outline" className="gap-2">
          {theme === "dark" ? "☀️" : "🌙"} Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </Button>
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <QuizResultsCard theme={theme}>
          <QuizResultsHeader
            theme={theme}
            title="Quiz Results"
            subtitle={results.quizTitle}
            leading={
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  theme === "light"
                    ? "text-slate-700 hover:bg-slate-100"
                    : "text-white hover:bg-white/20",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            }
          />

          <div className="space-y-8 p-6">
            <QuizResultsSummary
              theme={theme}
              confetti={showConfetti}
              data={summaryData}
            />

            <QuizResultsSection
              theme={theme}
              title="See where you stand"
              className={cn(
                theme === "light"
                  ? "bg-gradient-to-br from-slate-50/70 to-blue-50/60"
                  : "bg-white/5",
              )}
            >
              <QuizResultsLeaderboard entries={leaderboardEntries} theme={theme} />
            </QuizResultsSection>

            <QuizResultsStatsGrid
              theme={theme}
              data={summaryData}
            />

            <QuizResultsActions
              theme={theme}
              className="pt-2"
              primaryAction={
                <Button
                  onClick={shareResults}
                  disabled={isGenerating}
                  className={cn(
                    "group inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest shadow-lg transition-transform duration-200 ease-out hover:-translate-y-1",
                    theme === "light"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40"
                      : "bg-gradient-to-r from-amber-400 to-pink-500 text-slate-900 shadow-pink-500/25 hover:shadow-amber-500/40",
                  )}
                >
                  <Share2 className="h-4 w-4" />
                  {isGenerating ? "Generating..." : "Share Results"}
                  <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
                </Button>
              }
              secondaryAction={
                <Button
                  variant="outline"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition",
                    theme === "light"
                      ? "border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
                      : "border border-white/30 text-white/80 hover:border-white/60 hover:text-white",
                  )}
                >
                  <RotateCcw className="h-4 w-4" />
                  Take Another Quiz
                </Button>
              }
            />
          </div>
        </QuizResultsCard>
      </div>
    </div>
  );
}
