"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Search, Play, Trophy } from "lucide-react";

export function HowItWorks() {
  const { theme } = useShowcaseTheme();

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
    <section className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className={cn(
            "text-3xl font-bold mb-4",
            getTextColor(theme, "primary")
          )}>
            How It Works
          </h2>
          <p className={cn(
            "text-lg",
            getTextColor(theme, "secondary")
          )}>
            Get started in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={cn(
                  "relative rounded-2xl p-8 text-center backdrop-blur-sm transition-all duration-200 hover:scale-105",
                  getGlassCard(theme)
                )}
              >
                {/* Step number */}
                <div className={cn(
                  "absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  theme === "light"
                    ? "bg-blue-600 text-white"
                    : "bg-emerald-500 text-white"
                )}>
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-6 mt-4">
                  <div className={cn(
                    "rounded-full p-6",
                    theme === "light" 
                      ? "bg-white/80 shadow-lg" 
                      : "bg-white/10 shadow-lg"
                  )}>
                    <Icon className={cn(
                      "h-12 w-12",
                      getAccentColor(theme, step.color)
                    )} />
                  </div>
                </div>

                {/* Content */}
                <h3 className={cn(
                  "text-xl font-bold mb-4",
                  getTextColor(theme, "primary")
                )}>
                  {step.title}
                </h3>
                
                <p className={cn(
                  "text-sm leading-relaxed",
                  getTextColor(theme, "secondary")
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
