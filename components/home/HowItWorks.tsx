"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Search, Play, Trophy } from "lucide-react";

export function HowItWorks() {
  // Theme logic handled via CSS

  const steps = [
    {
      icon: Search,
      title: "Choose a Quiz",
      description: "Browse our extensive collection of sports quizzes and pick one that interests you.",
      color: "primary" as const,
    },
    {
      icon: Play,
      title: "Answer Questions",
      description: "Test your knowledge with carefully crafted questions across different difficulty levels.",
      color: "success" as const,
    },
    {
      icon: Trophy,
      title: "Compete & Win",
      description: "See how you rank against other players and climb the leaderboards to become a champion.",
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
              How It Works
            </h2>
            <p className={cn(
              "text-base sm:text-lg",
              getTextColor("secondary")
            )}>
              Get started in three simple steps
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={cn(
                  "relative rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center backdrop-blur-sm transition-all duration-200 hover:scale-105",
                  getGlassCard()
                )}
              >
                {/* Step number */}
                <div className={cn(
                  "absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold",
                  "bg-blue-600 text-white",
                  "dark:bg-emerald-500 dark:text-white"
                )}>
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-4 sm:mb-6 mt-2 sm:mt-4">
                  <div className={cn(
                    "rounded-full p-4 sm:p-6",
                    "bg-white/80 shadow-lg",
                    "dark:bg-white/10 dark:shadow-lg"
                  )}>
                    <Icon className={cn(
                      "h-8 w-8 sm:h-12 sm:w-12",
                      getAccentColor(step.color)
                    )} />
                  </div>
                </div>

                {/* Content */}
                <h3 className={cn(
                  "text-lg sm:text-xl font-bold mb-3 sm:mb-4",
                  getTextColor("primary")
                )}>
                  {step.title}
                </h3>

                <p className={cn(
                  "text-sm leading-relaxed",
                  getTextColor("secondary")
                )}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
