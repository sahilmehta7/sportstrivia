"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Trophy, Users, BookOpen, Star } from "lucide-react";

interface SocialProofProps {
  stats: {
    totalQuizzes: number;
    activeUsers: number;
    questionsAnswered: number;
    averageRating: number;
  };
}

export function SocialProof({ stats }: SocialProofProps) {
  const { theme } = useShowcaseTheme();

  const socialProofItems = [
    {
      icon: BookOpen,
      value: `${stats.totalQuizzes.toLocaleString()}+`,
      label: "Quizzes Available",
      color: "primary" as const,
    },
    {
      icon: Users,
      value: `${stats.activeUsers.toLocaleString()}+`,
      label: "Active Players",
      color: "success" as const,
    },
    {
      icon: Trophy,
      value: `${stats.questionsAnswered.toLocaleString()}+`,
      label: "Questions Answered",
      color: "warning" as const,
    },
    {
      icon: Star,
      value: `${stats.averageRating.toFixed(1)}/5`,
      label: "Average Rating",
      color: "warning" as const,
    },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className={cn(
            "text-3xl font-bold mb-4",
            getTextColor(theme, "primary")
          )}>
            Trusted by Sports Fans Worldwide
          </h2>
          <p className={cn(
            "text-lg",
            getTextColor(theme, "secondary")
          )}>
            Join thousands of players who test their knowledge daily
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {socialProofItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={cn(
                  "rounded-2xl p-8 text-center backdrop-blur-sm transition-all duration-200 hover:scale-105",
                  getGlassCard(theme)
                )}
              >
                <div className="flex justify-center mb-4">
                  <div className={cn(
                    "rounded-full p-4",
                    theme === "light" 
                      ? "bg-white/80 shadow-lg" 
                      : "bg-white/10 shadow-lg"
                  )}>
                    <Icon className={cn(
                      "h-8 w-8",
                      getAccentColor(theme, item.color)
                    )} />
                  </div>
                </div>
                
                <div className={cn(
                  "text-3xl font-bold mb-2",
                  getTextColor(theme, "primary")
                )}>
                  {item.value}
                </div>
                
                <div className={cn(
                  "text-sm font-medium",
                  getTextColor(theme, "secondary")
                )}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
