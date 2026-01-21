"use client";

import { getGlassCard, getTextColor, getGradientText } from "@/lib/showcase-theme";
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
  const socialProofItems = [
    {
      icon: BookOpen,
      value: `${stats.totalQuizzes.toLocaleString()}+`,
      label: "Quizzes",
      glow: "shadow-neon-cyan/20",
      iconColor: "text-primary",
    },
    {
      icon: Users,
      value: `${stats.activeUsers.toLocaleString()}+`,
      label: "Players",
      glow: "shadow-neon-magenta/20",
      iconColor: "text-secondary",
    },
    {
      icon: Trophy,
      value: `${stats.questionsAnswered.toLocaleString()}+`,
      label: "Answers",
      glow: "shadow-neon-lime/20",
      iconColor: "text-accent",
    },
    {
      icon: Star,
      value: `${stats.averageRating.toFixed(1)}/5`,
      label: "Rating",
      glow: "shadow-neon-cyan/20",
      iconColor: "text-primary",
    },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className={cn("text-4xl font-black tracking-tighter sm:text-5xl mb-4", getGradientText("neon"))}>
            TRUSTED BY THE BEST
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground font-medium">
            Join thousands of fans in the world's most competitive sports trivia arena.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {socialProofItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={cn(
                  "relative group rounded-[2rem] p-8 text-center",
                  "glass border-white/5 transition-all duration-500",
                  "hover:border-primary/20 hover:bg-white/10 hover:-translate-y-2",
                  item.glow
                )}
              >
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className={cn("absolute inset-0 rounded-full blur-xl opacity-20", item.iconColor)} />
                    <div className="relative rounded-2xl glass-elevated border-white/10 p-4">
                      <Icon className={cn("h-8 w-8", item.iconColor)} />
                    </div>
                  </div>
                </div>

                <div className="text-3xl font-black tracking-tighter mb-1">
                  {item.value}
                </div>

                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
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
