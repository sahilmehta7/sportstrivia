"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Trophy, Users, BookOpen, Star, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  stats: {
    totalQuizzes: number;
    activeUsers: number;
    questionsAnswered: number;
    averageRating: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  const { theme } = useShowcaseTheme();

  return (
    <section className="relative px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl text-center">
        {/* Main heading */}
        <div className="mb-8">
          <div className="mb-6 flex justify-center">
            <div className={cn(
              "rounded-full p-6 backdrop-blur-sm",
              theme === "light" 
                ? "bg-white/60 shadow-lg shadow-blue-500/20" 
                : "bg-white/5 shadow-lg shadow-emerald-500/20"
            )}>
              <Trophy className={cn(
                "h-16 w-16",
                theme === "light" ? "text-blue-600" : "text-emerald-300"
              )} />
            </div>
          </div>
          
          <h1 className={cn(
            "text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl mb-6",
            getTextColor(theme, "primary"),
            theme === "dark" ? "drop-shadow-[0_16px_32px_rgba(32,32,48,0.35)]" : ""
          )}>
            Test Your Sports{" "}
            <span className={cn(
              "bg-gradient-to-r bg-clip-text text-transparent",
              theme === "light" 
                ? "from-blue-600 to-purple-600" 
                : "from-emerald-300 to-blue-300"
            )}>
              Knowledge
            </span>
          </h1>
          
          <p className={cn(
            "mx-auto max-w-2xl text-lg sm:text-xl",
            getTextColor(theme, "secondary")
          )}>
            Compete with friends, climb the leaderboards, and become a sports trivia champion. 
            Challenge yourself with thousands of questions across all major sports.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mb-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/auth/signin">
            <Button 
              size="lg" 
              className={cn(
                "min-w-[200px] gap-2 text-lg font-semibold transition-all duration-200 hover:scale-105",
                theme === "light"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
              )}
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          
          <Link href="/quizzes">
            <Button 
              size="lg" 
              variant="outline"
              className={cn(
                "min-w-[200px] gap-2 text-lg font-semibold backdrop-blur-sm transition-all duration-200 hover:scale-105",
                theme === "light"
                  ? "border-blue-200 bg-white/60 text-blue-700 hover:bg-blue-50"
                  : "border-white/20 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              Browse Quizzes
              <BookOpen className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className={cn(
            "rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 hover:scale-105",
            getGlassCard(theme)
          )}>
            <div className="flex items-center justify-center mb-2">
              <BookOpen className={cn(
                "h-6 w-6",
                getAccentColor(theme, "primary")
              )} />
            </div>
            <div className={cn(
              "text-2xl font-bold mb-1",
              getTextColor(theme, "primary")
            )}>
              {stats.totalQuizzes.toLocaleString()}+
            </div>
            <div className={cn(
              "text-sm",
              getTextColor(theme, "secondary")
            )}>
              Quizzes Available
            </div>
          </div>

          <div className={cn(
            "rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 hover:scale-105",
            getGlassCard(theme)
          )}>
            <div className="flex items-center justify-center mb-2">
              <Users className={cn(
                "h-6 w-6",
                getAccentColor(theme, "success")
              )} />
            </div>
            <div className={cn(
              "text-2xl font-bold mb-1",
              getTextColor(theme, "primary")
            )}>
              {stats.activeUsers.toLocaleString()}+
            </div>
            <div className={cn(
              "text-sm",
              getTextColor(theme, "secondary")
            )}>
              Active Players
            </div>
          </div>

          <div className={cn(
            "rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 hover:scale-105",
            getGlassCard(theme)
          )}>
            <div className="flex items-center justify-center mb-2">
              <Trophy className={cn(
                "h-6 w-6",
                getAccentColor(theme, "warning")
              )} />
            </div>
            <div className={cn(
              "text-2xl font-bold mb-1",
              getTextColor(theme, "primary")
            )}>
              {stats.questionsAnswered.toLocaleString()}+
            </div>
            <div className={cn(
              "text-sm",
              getTextColor(theme, "secondary")
            )}>
              Questions Answered
            </div>
          </div>

          <div className={cn(
            "rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 hover:scale-105",
            getGlassCard(theme)
          )}>
            <div className="flex items-center justify-center mb-2">
              <Star className={cn(
                "h-6 w-6",
                getAccentColor(theme, "warning")
              )} />
            </div>
            <div className={cn(
              "text-2xl font-bold mb-1",
              getTextColor(theme, "primary")
            )}>
              {stats.averageRating.toFixed(1)}
            </div>
            <div className={cn(
              "text-sm",
              getTextColor(theme, "secondary")
            )}>
              Average Rating
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
