"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  RotateCcw, 
  ChevronLeft,
  Coins,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/services/leaderboard.service";
import { ShareResults } from "./ShareResults";

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

type ShowcaseVariant = "light" | "dark";

interface ShowcaseQuizResultsProps {
  attempt: QuizAttempt | null;
  leaderboardData: LeaderboardEntry[];
}

export function ShowcaseQuizResults({ attempt, leaderboardData }: ShowcaseQuizResultsProps) {
  const [variant, setVariant] = useState<ShowcaseVariant>("light");
  const [showConfetti] = useState(true);

  const toggleTheme = () => {
    setVariant(variant === "light" ? "dark" : "light");
  };

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

  return (
    <div className="space-y-8">
      {/* Theme Toggle */}
      <div className="flex justify-center">
        <Button 
          onClick={toggleTheme}
          variant="outline"
          className="gap-2"
        >
          {variant === "dark" ? "☀️" : "🌙"} Switch to {variant === "dark" ? "Light" : "Dark"} Mode
        </Button>
      </div>

      {/* Unified Quiz Results Container */}
      <div className="w-full max-w-4xl mx-auto">
        <div className={cn(
          "relative rounded-[1.75rem] border backdrop-blur-xl overflow-hidden",
          variant === "light" 
            ? "border-white/20 bg-gradient-to-br from-white/80 via-slate-50/90 to-blue-50/80 shadow-[0_40px_120px_-40px_rgba(59,130,246,0.15)]"
            : "border-white/10 bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]"
        )}>
          {/* Header */}
          <div className={cn(
            "px-6 py-4 border-b",
            variant === "light" 
              ? "border-slate-200/50" 
              : "border-white/10"
          )}>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className={cn(
                variant === "light" 
                  ? "text-slate-700 hover:bg-slate-100" 
                  : "text-white hover:bg-white/20"
              )}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className={cn(
                  "font-semibold text-lg",
                  variant === "light" ? "text-slate-900" : "text-white"
                )}>Quiz Results</h1>
                <p className={cn(
                  "text-sm",
                  variant === "light" ? "text-slate-600" : "text-white/80"
                )}>{results.quizTitle}</p>
              </div>
            </div>
          </div>

          <div className="p-0">
            {/* Congratulations Section */}
            <div className={cn(
              "relative p-6",
              variant === "light" 
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
                  variant === "light" ? "text-slate-900" : "text-white"
                )}>
                  Congratulations! You have scored
                </h2>
                
                {/* Score Circle */}
                <div className="relative inline-block mb-4">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center shadow-lg",
                    variant === "light"
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/25"
                      : "bg-gradient-to-br from-amber-400 to-pink-500 shadow-pink-500/25"
                  )}>
                    <div className={cn(
                      "text-center",
                      variant === "light" ? "text-white" : "text-slate-900"
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
                    variant === "light" ? "text-slate-600" : "text-white/75"
                  )}>You have earned</p>
                  <div className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 backdrop-blur-sm",
                    variant === "light"
                      ? "bg-gradient-to-r from-blue-100/80 to-purple-100/80 border border-blue-200/50"
                      : "bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/30"
                  )}>
                    <Coins className={cn(
                      "h-4 w-4",
                      variant === "light" ? "text-blue-600" : "text-amber-300"
                    )} />
                    <span className={cn(
                      "font-semibold",
                      variant === "light" ? "text-slate-900" : "text-white"
                    )}>{results.totalPoints} Points</span>
                  </div>
                </div>

                {/* Time Taken */}
                <div className={cn(
                  "flex items-center justify-center gap-2",
                  variant === "light" ? "text-emerald-600" : "text-emerald-300"
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
              variant === "light" 
                ? "bg-gradient-to-br from-slate-50/50 to-blue-50/50" 
                : "bg-white/5"
            )}>
              <h3 className={cn(
                "text-lg font-bold mb-4",
                variant === "light" ? "text-slate-900" : "text-white"
              )}>See where you stand</h3>
              
              <div className="space-y-3">
                {displayLeaderboard.map((entry, index) => (
                  <div key={entry.userId} className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl backdrop-blur-sm border",
                    variant === "light"
                      ? "bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] border-slate-200/50"
                      : "bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] border-white/10"
                  )}>
                    <div className="relative">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        variant === "light" ? "bg-slate-100" : "bg-white/10"
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
                            variant === "light" ? "text-slate-600" : "text-white/70"
                          )}>
                            {(entry.userName || "U").charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg",
                        variant === "light"
                          ? "bg-gradient-to-r from-blue-500 to-purple-600"
                          : "bg-gradient-to-r from-amber-400 to-pink-500"
                      )}>
                        <span className="text-xs font-bold text-white">{(index + 1).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className={cn(
                        "font-semibold",
                        variant === "light" ? "text-slate-900" : "text-white"
                      )}>{entry.userName || "Anonymous"}</p>
                      <p className={cn(
                        "text-sm",
                        variant === "light" ? "text-slate-600" : "text-white/60"
                      )}>
                        {entry.totalPoints || entry.score} points
                      </p>
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1 rounded-lg px-2 py-1 backdrop-blur-sm",
                      variant === "light"
                        ? "bg-gradient-to-r from-blue-100/80 to-purple-100/80 border border-blue-200/50"
                        : "bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/30"
                    )}>
                      <Coins className={cn(
                        "h-3 w-3",
                        variant === "light" ? "text-blue-600" : "text-amber-300"
                      )} />
                      <span className={cn(
                        "text-sm font-semibold",
                        variant === "light" ? "text-slate-900" : "text-white"
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
                variant === "light"
                  ? "border-slate-200/50 bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]"
                  : "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={cn(
                    "h-4 w-4",
                    variant === "light" ? "text-amber-600" : "text-amber-300"
                  )} />
                  <p className={cn(
                    "font-semibold text-sm",
                    variant === "light" ? "text-slate-900" : "text-white"
                  )}>Longest Streak</p>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  variant === "light" ? "text-slate-900" : "text-white"
                )}>{results.longestStreak} correct</p>
              </div>
              
              <div className={cn(
                "rounded-2xl border p-4 backdrop-blur-sm",
                variant === "light"
                  ? "border-slate-200/50 bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]"
                  : "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={cn(
                    "h-4 w-4",
                    variant === "light" ? "text-emerald-600" : "text-emerald-300"
                  )} />
                  <p className={cn(
                    "font-semibold text-sm",
                    variant === "light" ? "text-slate-900" : "text-white"
                  )}>Avg. Response Time</p>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  variant === "light" ? "text-slate-900" : "text-white"
                )}>{results.averageResponseTime.toFixed(1)} sec</p>
              </div>
              
              <div className={cn(
                "rounded-2xl border p-4 backdrop-blur-sm",
                variant === "light"
                  ? "border-slate-200/50 bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]"
                  : "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={cn(
                    "h-4 w-4",
                    variant === "light" ? "text-blue-600" : "text-blue-300"
                  )} />
                  <p className={cn(
                    "font-semibold text-sm",
                    variant === "light" ? "text-slate-900" : "text-white"
                  )}>Total Time</p>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  variant === "light" ? "text-slate-900" : "text-white"
                )}>{formatTime(results.timeSpent)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0">
              <div className="mb-4">
                <ShareResults
                  quizTitle={results.quizTitle}
                  userName={results.userName}
                  score={results.score}
                  correctAnswers={results.correctAnswers}
                  totalQuestions={results.totalQuestions}
                  totalPoints={results.totalPoints}
                  timeSpent={results.timeSpent}
                />
              </div>
              
              <Button variant="outline" className={cn(
                "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition",
                variant === "light"
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
