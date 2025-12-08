"use client";

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
  // Theme styling via CSS

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
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className={cn(
          "relative w-full max-w-5xl mx-auto rounded-[1.75rem] border p-6 sm:p-8 backdrop-blur-xl mb-8",
          getGlassCard()
        )}>
          <div className="text-center">
            <h2 className={cn(
              "text-2xl sm:text-3xl font-bold mb-4",
              getTextColor("primary")
            )}>
              Trusted by Sports Fans Worldwide
            </h2>
            <p className={cn(
              "text-base sm:text-lg",
              getTextColor("secondary")
            )}>
              Join thousands of players who test their knowledge daily
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {socialProofItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={cn(
                  "rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center backdrop-blur-sm transition-all duration-200 hover:scale-105",
                  getGlassCard()
                )}
              >
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className={cn(
                    "rounded-full p-3 sm:p-4",
                    "bg-white/80 shadow-lg",
                    "dark:bg-white/10 dark:shadow-lg"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6 sm:h-8 sm:w-8",
                      getAccentColor(item.color)
                    )} />
                  </div>
                </div>

                <div className={cn(
                  "text-2xl sm:text-3xl font-bold mb-2",
                  getTextColor("primary")
                )}>
                  {item.value}
                </div>

                <div className={cn(
                  "text-sm font-medium",
                  getTextColor("secondary")
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
