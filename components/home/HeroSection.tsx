"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { cn } from "@/lib/utils";
import { Trophy, Users, BookOpen, Star, ArrowRight, Sun, Moon } from "lucide-react";

interface HeroSectionProps {
  stats: {
    totalQuizzes: number;
    activeUsers: number;
    questionsAnswered: number;
    averageRating: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  const { theme, toggleTheme } = useShowcaseTheme();

  return (
    <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="mx-auto max-w-6xl text-center">
        {/* Main heading */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6 flex justify-center">
            <div className={cn(
              "rounded-full p-4 sm:p-6 backdrop-blur-sm transition-colors duration-300",
              "bg-white/60 shadow-lg shadow-blue-500/20",
              "dark:bg-white/5 dark:shadow-emerald-500/20"
            )}>
              <Trophy className={cn(
                "h-12 w-12 sm:h-16 sm:w-16 transition-colors duration-300",
                "text-blue-600 dark:text-emerald-300"
              )} />
            </div>
          </div>

          <h1 className={cn(
            "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tight mb-4 sm:mb-6",
            "text-slate-900 dark:text-white transition-colors duration-300",
            "dark:drop-shadow-[0_16px_32px_rgba(32,32,48,0.35)]"
          )}>
            Test Your Sports{" "}
            <span className={cn(
              "bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300",
              "from-blue-600 to-purple-600",
              "dark:from-emerald-300 dark:to-blue-300"
            )}>
              Knowledge
            </span>
          </h1>

          <p className={cn(
            "mx-auto max-w-2xl text-base sm:text-lg lg:text-xl transition-colors duration-300",
            "text-slate-600 dark:text-slate-300"
          )}>
            Compete with friends, climb the leaderboards, and become a sports trivia champion.
            Challenge yourself with thousands of questions across all major sports.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <Link href="/auth/signin">
            <Button
              size="lg"
              className={cn(
                "w-full sm:min-w-[200px] gap-2 text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-105",
                "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25",
                "dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:shadow-emerald-600/25"
              )}
            >
              Get Started
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>

          <Link href="/quizzes">
            <Button
              size="lg"
              variant="outline"
              className={cn(
                "w-full sm:min-w-[200px] gap-2 text-base sm:text-lg font-semibold backdrop-blur-sm transition-all duration-200 hover:scale-105",
                "border-blue-200 bg-white/60 text-blue-700 hover:bg-blue-50",
                "dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              )}
            >
              Browse Quizzes
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {[
            {
              icon: BookOpen,
              value: `${stats.totalQuizzes.toLocaleString()}+`,
              label: "Quizzes Available",
              iconColor: "text-blue-500 dark:text-blue-400"
            },
            {
              icon: Users,
              value: `${stats.activeUsers.toLocaleString()}+`,
              label: "Active Players",
              iconColor: "text-emerald-500 dark:text-emerald-400"
            },
            {
              icon: Trophy,
              value: `${stats.questionsAnswered.toLocaleString()}+`,
              label: "Questions Answered",
              iconColor: "text-amber-500 dark:text-amber-400"
            },
            {
              icon: Star,
              value: stats.averageRating.toFixed(1),
              label: "Average Rating",
              iconColor: "text-amber-500 dark:text-amber-400"
            }
          ].map((item, i) => (
            <div key={i} className={cn(
              "rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm transition-all duration-200 hover:scale-105",
              "bg-white/50 border border-white/20 shadow-lg shadow-black/5",
              "dark:bg-white/5 dark:border-white/10 dark:shadow-black/20"
            )}>
              <div className="flex items-center justify-center mb-2">
                <item.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", item.iconColor)} />
              </div>
              <div className={cn(
                "text-lg sm:text-2xl font-bold mb-1 transition-colors duration-300",
                "text-slate-900 dark:text-white"
              )}>
                {item.value}
              </div>
              <div className={cn(
                "text-xs sm:text-sm transition-colors duration-300",
                "text-slate-500 dark:text-slate-400"
              )}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}