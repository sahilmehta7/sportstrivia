"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Trophy, 
  Calendar, 
  BarChart3, 
  Users, 
  Award 
} from "lucide-react";

export function Features() {
  const { theme } = useShowcaseTheme();

  const features = [
    {
      icon: BookOpen,
      title: "Diverse Quiz Topics",
      description: "From cricket to basketball, explore quizzes across all major sports and disciplines.",
      color: "primary" as const,
    },
    {
      icon: Trophy,
      title: "Real-time Leaderboards",
      description: "Compete with players worldwide and see your ranking update in real-time.",
      color: "warning" as const,
    },
    {
      icon: Calendar,
      title: "Daily Challenges",
      description: "New challenges every day to keep your sports knowledge sharp and engaging.",
      color: "success" as const,
    },
    {
      icon: BarChart3,
      title: "Track Your Progress",
      description: "Monitor your improvement with detailed statistics and performance analytics.",
      color: "primary" as const,
    },
    {
      icon: Users,
      title: "Compete with Friends",
      description: "Challenge your friends and create private competitions to see who knows more.",
      color: "success" as const,
    },
    {
      icon: Award,
      title: "Earn Badges",
      description: "Unlock achievements and badges as you master different sports and topics.",
      color: "warning" as const,
    },
  ];

  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className={cn(
          "relative w-full max-w-5xl mx-auto rounded-[1.75rem] border p-6 sm:p-8 backdrop-blur-xl mb-8",
          getGlassCard(theme)
        )}>
          <div className="text-center">
            <h2 className={cn(
              "text-2xl sm:text-3xl font-bold mb-4",
              getTextColor(theme, "primary")
            )}>
              Why Choose Sports Trivia?
            </h2>
            <p className={cn(
              "text-base sm:text-lg",
              getTextColor(theme, "secondary")
            )}>
              Discover what makes our platform the ultimate destination for sports fans
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={cn(
                  "rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm transition-all duration-200 hover:scale-105",
                  getGlassCard(theme)
                )}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={cn(
                    "rounded-lg p-2 sm:p-3 flex-shrink-0",
                    theme === "light" 
                      ? "bg-white/80 shadow-lg" 
                      : "bg-white/10 shadow-lg"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 sm:h-6 sm:w-6",
                      getAccentColor(theme, feature.color)
                    )} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={cn(
                      "text-base sm:text-lg font-bold mb-2",
                      getTextColor(theme, "primary")
                    )}>
                      {feature.title}
                    </h3>
                    
                    <p className={cn(
                      "text-xs sm:text-sm leading-relaxed",
                      getTextColor(theme, "secondary")
                    )}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
