"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Share2,
  RotateCcw, 
  ChevronLeft,
  Coins,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/services/leaderboard.service";
import { useShareResults } from "./ShareResults";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";

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

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "0 sec";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };


  // Use real data or fallback to mock data
  const results = attempt ? {
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
  } : {
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
  };

  // Find user's position in leaderboard
  const userPosition = attempt ? leaderboardData.findIndex(entry => entry.userId === attempt.user.id) : -1;
  const isUserInTop3 = userPosition >= 0 && userPosition < 3;
  
  // Show top 3 + user if not in top 3
  const displayLeaderboard = isUserInTop3 
    ? leaderboardData.slice(0, 3)
    : [...leaderboardData.slice(0, 3), ...(userPosition >= 3 ? [leaderboardData[userPosition]] : [])];

  // Share results functionality
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
      {/* Theme Toggle */}
      <div className="flex justify-center">
        <Button
          onClick={toggleTheme}
          variant="outline"
          className="gap-2"
        >
          {theme === "dark" ? "☀️" : "🌙"} Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </Button>
      </div>

      {/* Unified Quiz Results Container */}
      <div className="w-full max-w-4xl mx-auto">
        <div className={cn(
          "relative rounded-[1.75rem] border backdrop-blur-xl overflow-hidden",
          getGlassCard(theme)
        )}>
          {/* Header */}
          <div className={cn(
            "px-6 py-4 border-b",
            theme === "light" 
              ? "border-slate-200/50" 
              : "border-white/10"
          )}>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className={cn(
                theme === "light" 
                  ? "text-slate-700 hover:bg-slate-100" 
                  : "text-white hover:bg-white/20"
              )}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className={cn(
                  "font-semibold text-lg",
                  getTextColor(theme, "primary")
                )}>Quiz Results</h1>
                <p className={cn(
                  "text-sm",
                  getTextColor(theme, "secondary")
                )}>{results.quizTitle}</p>
              </div>
            </div>
          </div>

          <div className="p-0">
            {/* Congratulations Section */}
            <div className={cn(
              "relative p-6",
              theme === "light" 
                ? "bg-gradient-to-br from-blue-50/50 to-purple-50/50" 
                : "bg-white/5"
            )}>
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Confetti */}
                  <div className="absolute top-4 left-8 w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="absolute top-6 right-12 w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="absolute top-8 left-16 w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  <div className="absolute top-10 right-8 w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.6s" }} />
                  <div className="absolute top-12 left-12 w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.8s" }} />
                </div>
              )}
              
              <div className="text-center">
                <h2 className={cn(
                  "text-xl font-bold mb-4",
                  getTextColor(theme, "primary")
                )}>
                  Congratulations! You have scored
                </h2>
                
                {/* Score Circle */}
                <div className="relative inline-block mb-4">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center shadow-lg",
                    theme === "light"
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/25"
                      : "bg-gradient-to-br from-amber-400 to-pink-500 shadow-pink-500/25"
                  )}>
                    <div className={cn(
                      "text-center",
                      theme === "light" ? "text-white" : getTextColor(theme, "primary")
                    )}>
                      <div className="text-2xl font-bold">{results.correctAnswers}</div>
                      <div className="text-xs">Out of {results.totalQuestions}</div>
                    </div>
                  </div>
                </div>

                {/* Points Earned */}
                <div className="mb-4">
                  <p className={cn(
                    "mb-2",
                    getTextColor(theme, "secondary")
                  )}>You have earned</p>
                  <div className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 backdrop-blur-sm",
                    theme === "light"
                      ? "bg-gradient-to-r from-blue-100/80 to-purple-100/80 border border-blue-200/50"
                      : "bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/30"
                  )}>
                    <Coins className={cn(
                      "h-4 w-4",
                      getAccentColor(theme, "primary")
                    )} />
                    <span className={cn(
                      "font-semibold",
                      getTextColor(theme, "primary")
                    )}>{results.totalPoints} Points</span>
                  </div>
                </div>

                {/* Time Taken */}
                <div className={cn(
                  "flex items-center justify-center gap-2",
                  getAccentColor(theme, "success")
                )}>
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    You took {formatTime(results.timeSpent)} to complete the quiz
                  </span>
                </div>
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className={cn(
              "p-6",
              theme === "light" 
                ? "bg-gradient-to-br from-slate-50/50 to-blue-50/50" 
                : "bg-white/5"
            )}>
              <h3 className={cn(
                "text-lg font-bold mb-4",
                getTextColor(theme, "primary")
              )}>See where you stand</h3>
              
              <div className="space-y-3">
                {displayLeaderboard.map((entry, index) => (
                  <div key={`${entry.userId}-${index}`} className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl backdrop-blur-sm border",
                    theme === "light"
                      ? "bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] border-slate-200/50"
                      : "bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] border-white/10"
                  )}>
                    <div className="relative">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        theme === "light" ? "bg-slate-100" : "bg-white/10"
                      )}>
                        {entry.userImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={entry.userImage} 
                            alt={entry.userName || "User"} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className={cn(
                            "text-sm font-medium",
                            getTextColor(theme, "muted")
                          )}>
                            {(entry.userName || "U").charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg",
                        theme === "light"
                          ? "bg-gradient-to-r from-blue-500 to-purple-600"
                          : "bg-gradient-to-r from-amber-400 to-pink-500"
                      )}>
                        <span className="text-xs font-bold text-white">{(index + 1).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className={cn(
                        "font-semibold",
                        getTextColor(theme, "primary")
                      )}>{entry.userName || "Anonymous"}</p>
                      <p className={cn(
                        "text-sm",
                        getTextColor(theme, "muted")
                      )}>
                        {entry.totalPoints || entry.score} points
                      </p>
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1 rounded-lg px-2 py-1 backdrop-blur-sm",
                      theme === "light"
                        ? "bg-gradient-to-r from-blue-100/80 to-purple-100/80 border border-blue-200/50"
                        : "bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/30"
                    )}>
                      <Coins className={cn(
                        "h-3 w-3",
                        getAccentColor(theme, "primary")
                      )} />
                      <span className={cn(
                        "text-sm font-semibold",
                        getTextColor(theme, "primary")
                      )}>{entry.totalPoints || entry.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-6">
              <div className={cn(
                "rounded-2xl border p-4 backdrop-blur-sm",
                theme === "light"
                  ? "border-slate-200/50 bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]"
                  : "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={cn(
                    "h-4 w-4",
                    getAccentColor(theme, "warning")
                  )} />
                  <p className={cn(
                    "font-semibold text-sm",
                    getTextColor(theme, "primary")
                  )}>Longest Streak</p>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  getTextColor(theme, "primary")
                )}>{results.longestStreak} correct</p>
              </div>
              
              <div className={cn(
                "rounded-2xl border p-4 backdrop-blur-sm",
                theme === "light"
                  ? "border-slate-200/50 bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]"
                  : "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={cn(
                    "h-4 w-4",
                    getAccentColor(theme, "success")
                  )} />
                  <p className={cn(
                    "font-semibold text-sm",
                    getTextColor(theme, "primary")
                  )}>Avg. Response Time</p>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  getTextColor(theme, "primary")
                )}>{results.averageResponseTime.toFixed(1)} sec</p>
              </div>
              
              <div className={cn(
                "rounded-2xl border p-4 backdrop-blur-sm",
                theme === "light"
                  ? "border-slate-200/50 bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]"
                  : "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={cn(
                    "h-4 w-4",
                    getAccentColor(theme, "primary")
                  )} />
                  <p className={cn(
                    "font-semibold text-sm",
                    getTextColor(theme, "primary")
                  )}>Total Time</p>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  getTextColor(theme, "primary")
                )}>{formatTime(results.timeSpent)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 p-6 pt-0">
              <Button 
                onClick={shareResults}
                disabled={isGenerating}
                className={cn(
                  "group inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest shadow-lg transition-transform duration-200 ease-out hover:-translate-y-1",
                  theme === "light"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40"
                    : "bg-gradient-to-r from-amber-400 to-pink-500 text-slate-900 shadow-pink-500/25 hover:shadow-amber-500/40"
                )}
              >
                <Share2 className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Share Results"}
                <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
              </Button>
              
              <Button variant="outline" className={cn(
                "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition",
                theme === "light"
                  ? "border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
                  : "border border-white/30 text-white/80 hover:border-white/60 hover:text-white"
              )}>
                <RotateCcw className="h-4 w-4" />
                Take Another Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
