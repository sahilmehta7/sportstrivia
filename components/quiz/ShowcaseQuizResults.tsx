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
import type { LeaderboardEntry } from "@/lib/services/leaderboard.service";

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
        <div className="relative rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-white font-semibold text-lg">Quiz Results</h1>
                <p className="text-white/80 text-sm">{results.quizTitle}</p>
              </div>
            </div>
          </div>

          <div className="p-0">
            {/* Congratulations Section */}
            <div className="relative p-6 bg-white/5">
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
                <h2 className="text-xl font-bold mb-4 text-white">
                  Congratulations! You have scored
                </h2>
                
                {/* Score Circle */}
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/25">
                    <div className="text-center text-slate-900">
                      <div className="text-2xl font-bold">{results.correctAnswers}</div>
                      <div className="text-xs">Out of {results.totalQuestions}</div>
                    </div>
                  </div>
                </div>

                {/* Points Earned */}
                <div className="mb-4">
                  <p className="mb-2 text-white/75">You have earned</p>
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/30 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <Coins className="h-4 w-4 text-amber-300" />
                    <span className="font-semibold text-white">{results.totalPoints} Points</span>
                  </div>
                </div>

                {/* Time Taken */}
                <div className="flex items-center justify-center gap-2 text-emerald-300">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    You took {formatTime(results.timeSpent)} to complete the quiz
                  </span>
                </div>
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="p-6 bg-white/5">
              <h3 className="text-lg font-bold mb-4 text-white">See where you stand</h3>
              
              <div className="space-y-3">
                {displayLeaderboard.map((entry, index) => (
                  <div key={entry.userId} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] border border-white/10">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10">
                        {entry.userImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={entry.userImage} 
                            alt={entry.userName || "User"} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-white/70">
                            {(entry.userName || "U").charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-xs font-bold text-slate-900">{(index + 1).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-white">{entry.userName || "Anonymous"}</p>
                      <p className="text-sm text-white/60">
                        {entry.totalPoints || entry.score} points
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/30 rounded-lg px-2 py-1 backdrop-blur-sm">
                      <Coins className="h-3 w-3 text-amber-300" />
                      <span className="text-sm font-semibold text-white">{entry.totalPoints || entry.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-300" />
                  <p className="font-semibold text-sm text-white">Longest Streak</p>
                </div>
                <p className="text-2xl font-bold text-white">{results.longestStreak} correct</p>
              </div>
              
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-emerald-300" />
                  <p className="font-semibold text-sm text-white">Avg. Response Time</p>
                </div>
                <p className="text-2xl font-bold text-white">{results.averageResponseTime.toFixed(1)} sec</p>
              </div>
              
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-300" />
                  <p className="font-semibold text-sm text-white">Total Time</p>
                </div>
                <p className="text-2xl font-bold text-white">{formatTime(results.timeSpent)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 p-6 pt-0">
              <Button className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-slate-900 shadow-lg shadow-pink-500/25 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-amber-500/40">
                <Share2 className="h-4 w-4" />
                Share Results
                <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
              </Button>
              <Button variant="outline" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/60 hover:text-white">
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
