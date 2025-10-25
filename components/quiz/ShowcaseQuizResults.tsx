"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Clock, 
  Share2, 
  RotateCcw, 
  ChevronLeft,
  Coins,
  Target,
  Zap,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  timeSpent: number;
  passed: boolean;
  longestStreak: number;
  averageResponseTime: number;
  badges: string[];
  progression: {
    tier: string;
    tierLabel: string;
    totalPoints: number;
    leveledUp: boolean;
    nextTier: string | null;
    nextTierLabel: string | null;
    pointsToNext: number | null;
    progressPercent: number;
  };
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  avatarUrl?: string | null;
  position: number;
  school?: string;
  points: number;
}

const mockResults: QuizResult = {
  score: 73.3,
  totalQuestions: 15,
  correctAnswers: 11,
  totalPoints: 80,
  timeSpent: 719, // 11 min 59 sec
  passed: true,
  longestStreak: 5,
  averageResponseTime: 2.1,
  badges: ["Speed Demon", "Perfect Streak"],
  progression: {
    tier: "silver",
    tierLabel: "Silver Scholar",
    totalPoints: 1250,
    leveledUp: false,
    nextTier: "gold",
    nextTierLabel: "Gold Master",
    pointsToNext: 250,
    progressPercent: 75
  }
};

const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: "1",
    name: "Hangakore Hariwana",
    score: 100,
    position: 1,
    school: "ABN School",
    points: 77531,
    avatarUrl: "/api/placeholder/40/40"
  },
  {
    id: "2", 
    name: "Sibabalwe Rubusana",
    score: 98,
    position: 2,
    school: "Advance Academy",
    points: 77531,
    avatarUrl: "/api/placeholder/40/40"
  },
  {
    id: "3",
    name: "Tamaki Ryushi", 
    score: 95,
    position: 3,
    school: "Delhi Public School",
    points: 77531,
    avatarUrl: "/api/placeholder/40/40"
  }
];

type ShowcaseVariant = "light" | "dark";

export function ShowcaseQuizResults() {
  const [variant, setVariant] = useState<ShowcaseVariant>("light");
  const [showConfetti] = useState(true);

  const toggleTheme = () => {
    setVariant(variant === "light" ? "dark" : "light");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

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

      {/* Mobile Quiz Results */}
      <div className="max-w-md mx-auto">
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
              <h1 className="text-white font-semibold">Quiz Results</h1>
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
                      <div className="text-2xl font-bold">{mockResults.correctAnswers}</div>
                      <div className="text-xs">Out of {mockResults.totalQuestions}</div>
                    </div>
                  </div>
                </div>

                {/* Points Earned */}
                <div className="mb-4">
                  <p className={cn("mb-2", variant === "light" ? "text-gray-700" : "text-gray-300")}>You have earned</p>
                  <div className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-gray-900">{mockResults.totalPoints} Points</span>
                  </div>
                </div>

                {/* Time Taken */}
                <div className={cn("flex items-center justify-center gap-2", variant === "light" ? "text-blue-600" : "text-blue-400")}>
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    You took {formatTime(mockResults.timeSpent)} to complete the quiz
                  </span>
                </div>
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className={cn("p-6", variant === "light" ? "bg-gray-50" : "bg-gray-800")}>
              <h3 className={cn("text-lg font-bold mb-4", variant === "light" ? "text-gray-900" : "text-white")}>See where you stand</h3>
              
              <div className="space-y-3">
                {mockLeaderboard.map((entry) => (
                  <div key={entry.id} className={cn("flex items-center gap-3 p-3 rounded-lg border", variant === "light" ? "bg-white" : "bg-gray-700 border-gray-600")}>
                    <div className="relative">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", variant === "light" ? "bg-gray-200" : "bg-gray-600")}>
                        <span className={cn("text-sm font-medium", variant === "light" ? "text-gray-600" : "text-gray-300")}>
                          {entry.name.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{entry.position.toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className={cn("font-semibold", variant === "light" ? "text-gray-900" : "text-white")}>{entry.name}</p>
                      <p className={cn("text-sm", variant === "light" ? "text-gray-500" : "text-gray-400")}>{entry.school}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-yellow-100 border border-yellow-300 rounded-lg px-2 py-1">
                      <Coins className="h-3 w-3 text-yellow-600" />
                      <span className="text-sm font-semibold text-gray-900">{entry.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Desktop Results */}
      <div className="max-w-4xl mx-auto">
        <Card className={cn(variant === "dark" ? "bg-gray-900 border-gray-700" : "")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", variant === "dark" ? "text-white" : "")}>
              <Trophy className="h-5 w-5 text-yellow-500" />
              Quiz Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Summary */}
            <div className="text-center">
              <div className="mb-4">
                <p className={cn("text-3xl font-bold", getScoreColor(mockResults.score))}>
                  Score: {mockResults.score.toFixed(1)}%
                </p>
                <p className={cn(variant === "dark" ? "text-gray-400" : "text-muted-foreground")}>
                  {mockResults.correctAnswers} / {mockResults.totalQuestions} correct
                </p>
              </div>
              
              <Badge variant={mockResults.passed ? "default" : "destructive"} className="mb-6">
                {mockResults.passed ? "Passed" : "Did not pass"}
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={cn("rounded-lg border p-4", variant === "dark" ? "bg-gray-800 border-gray-600" : "bg-card")}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <p className={cn("font-semibold text-sm", variant === "dark" ? "text-white" : "")}>Total Points</p>
                </div>
                <p className={cn("text-2xl font-bold", variant === "dark" ? "text-white" : "")}>{mockResults.totalPoints}</p>
              </div>
              
              <div className={cn("rounded-lg border p-4", variant === "dark" ? "bg-gray-800 border-gray-600" : "bg-card")}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className={cn("font-semibold text-sm", variant === "dark" ? "text-white" : "")}>Longest Streak</p>
                </div>
                <p className={cn("text-2xl font-bold", variant === "dark" ? "text-white" : "")}>{mockResults.longestStreak} correct</p>
              </div>
              
              <div className={cn("rounded-lg border p-4", variant === "dark" ? "bg-gray-800 border-gray-600" : "bg-card")}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className={cn("font-semibold text-sm", variant === "dark" ? "text-white" : "")}>Avg. Response Time</p>
                </div>
                <p className={cn("text-2xl font-bold", variant === "dark" ? "text-white" : "")}>{mockResults.averageResponseTime.toFixed(1)} sec</p>
              </div>
              
              <div className={cn("rounded-lg border p-4", variant === "dark" ? "bg-gray-800 border-gray-600" : "bg-card")}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className={cn("font-semibold text-sm", variant === "dark" ? "text-white" : "")}>Total Time</p>
                </div>
                <p className={cn("text-2xl font-bold", variant === "dark" ? "text-white" : "")}>{formatTime(mockResults.timeSpent)}</p>
              </div>
            </div>

            {/* Progression */}
            <div className={cn("rounded-lg border p-4", variant === "dark" ? "border-primary/30 bg-primary/10" : "border-primary/30 bg-primary/5")}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={cn("text-sm font-semibold", variant === "dark" ? "text-white" : "")}>Current Tier</p>
                  <p className={cn("text-lg font-bold", variant === "dark" ? "text-white" : "")}>{mockResults.progression.tierLabel}</p>
                </div>
                <Badge>{mockResults.progression.tierLabel}</Badge>
              </div>
              
              <div className={cn("text-sm mb-3", variant === "dark" ? "text-gray-400" : "text-muted-foreground")}>
                Career points: <span className={cn("font-semibold", variant === "dark" ? "text-white" : "text-foreground")}>{mockResults.progression.totalPoints}</span>
              </div>
              
              <div className="space-y-2">
                <div className={cn("flex items-center justify-between text-xs", variant === "dark" ? "text-gray-400" : "text-muted-foreground")}>
                  <span>Progress to {mockResults.progression.nextTierLabel}</span>
                  <span>{mockResults.progression.progressPercent}%</span>
                </div>
                <Progress value={mockResults.progression.progressPercent} className="h-2" />
                <p className={cn("text-xs", variant === "dark" ? "text-gray-400" : "text-muted-foreground")}>
                  {mockResults.progression.pointsToNext} points until {mockResults.progression.nextTierLabel}
                </p>
              </div>
            </div>

            {/* Badges */}
            {mockResults.badges.length > 0 && (
              <div className={cn("rounded-lg border p-4", variant === "dark" ? "border-emerald-400/40 bg-emerald-400/20" : "border-emerald-400/40 bg-emerald-400/10")}>
                <p className={cn("text-sm font-semibold mb-2", variant === "dark" ? "text-white" : "")}>New badges unlocked</p>
                <div className="flex flex-wrap gap-2">
                  {mockResults.badges.map((badge) => (
                    <Badge key={badge} variant="secondary">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Take Another Quiz
              </Button>
              <Button variant="secondary">
                <Users className="h-4 w-4 mr-2" />
                View Leaderboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
