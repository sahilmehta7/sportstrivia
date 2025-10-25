"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="max-w-4xl mx-auto">
        <Card className={cn("overflow-hidden", variant === "dark" ? "bg-gray-900 border-gray-700" : "")}>
          {/* Header */}
          <div className={cn(
            "px-4 py-3",
            variant === "light" 
              ? "bg-gradient-to-r from-purple-600 to-blue-600" 
              : "bg-gradient-to-r from-blue-900 to-purple-900"
          )}>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-white font-semibold">Quiz Results</h1>
                <p className="text-white/80 text-sm">{results.quizTitle}</p>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Congratulations Section */}
            <div className={cn("relative p-6", variant === "light" ? "bg-white" : "bg-gray-900")}>
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
                <h2 className={cn("text-xl font-bold mb-4", variant === "light" ? "text-gray-900" : "text-white")}>
                  Congratulations! You have scored
                </h2>
                
                {/* Score Circle */}
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-2xl font-bold">{results.correctAnswers}</div>
                      <div className="text-xs">Out of {results.totalQuestions}</div>
                    </div>
                  </div>
                </div>

                {/* Points Earned */}
                <div className="mb-4">
                  <p className={cn("mb-2", variant === "light" ? "text-gray-700" : "text-gray-300")}>You have earned</p>
                  <div className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-gray-900">{results.totalPoints} Points</span>
                  </div>
                </div>

                {/* Time Taken */}
                <div className={cn("flex items-center justify-center gap-2", variant === "light" ? "text-blue-600" : "text-blue-400")}>
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    You took {formatTime(results.timeSpent)} to complete the quiz
                  </span>
                </div>
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className={cn("p-6", variant === "light" ? "bg-gray-50" : "bg-gray-800")}>
              <h3 className={cn("text-lg font-bold mb-4", variant === "light" ? "text-gray-900" : "text-white")}>See where you stand</h3>
              
              <div className="space-y-3">
                {displayLeaderboard.map((entry, index) => (
                  <div key={entry.userId} className={cn("flex items-center gap-3 p-3 rounded-lg border", variant === "light" ? "bg-white" : "bg-gray-700 border-gray-600")}>
                    <div className="relative">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", variant === "light" ? "bg-gray-200" : "bg-gray-600")}>
                        {entry.userImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={entry.userImage} 
                            alt={entry.userName || "User"} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className={cn("text-sm font-medium", variant === "light" ? "text-gray-600" : "text-gray-300")}>
                            {(entry.userName || "U").charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{(index + 1).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className={cn("font-semibold", variant === "light" ? "text-gray-900" : "text-white")}>{entry.userName || "Anonymous"}</p>
                      <p className={cn("text-sm", variant === "light" ? "text-gray-500" : "text-gray-400")}>
                        {entry.totalPoints || entry.score} points
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-yellow-100 border border-yellow-300 rounded-lg px-2 py-1">
                      <Coins className="h-3 w-3 text-yellow-600" />
                      <span className="text-sm font-semibold text-gray-900">{entry.totalPoints || entry.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-6">
              <div className={cn("rounded-lg border p-4", variant === "dark" ? "bg-gray-800 border-gray-600" : "bg-card")}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className={cn("font-semibold text-sm", variant === "dark" ? "text-white" : "")}>Longest Streak</p>
                </div>
                <p className={cn("text-2xl font-bold", variant === "dark" ? "text-white" : "")}>{results.longestStreak} correct</p>
              </div>
              
              <div className={cn("rounded-lg border p-4", variant === "dark" ? "bg-gray-800 border-gray-600" : "bg-card")}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className={cn("font-semibold text-sm", variant === "dark" ? "text-white" : "")}>Avg. Response Time</p>
                </div>
                <p className={cn("text-2xl font-bold", variant === "dark" ? "text-white" : "")}>{results.averageResponseTime.toFixed(1)} sec</p>
              </div>
              
              <div className={cn("rounded-lg border p-4", variant === "dark" ? "bg-gray-800 border-gray-600" : "bg-card")}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className={cn("font-semibold text-sm", variant === "dark" ? "text-white" : "")}>Total Time</p>
                </div>
                <p className={cn("text-2xl font-bold", variant === "dark" ? "text-white" : "")}>{formatTime(results.timeSpent)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 p-6 pt-0">
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Take Another Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
