"use client";

import { getGlassCard, getTextColor, getGradientText } from "@/lib/showcase-theme";
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
  const features = [
    {
      icon: BookOpen,
      title: "Global Playbook",
      description: "Explore 150+ quizzes across every major sport and deep-dive topics.",
      glow: "shadow-neon-cyan/10",
      iconColor: "text-primary",
    },
    {
      icon: Trophy,
      title: "Neon Leaderboards",
      description: "Climb the ranks and claim your spot among the legendary sport fanatics.",
      glow: "shadow-neon-magenta/10",
      iconColor: "text-secondary",
    },
    {
      icon: Calendar,
      title: "Match Day Drill",
      description: "Fresh challenges every single day to keep your game sharp.",
      glow: "shadow-neon-lime/10",
      iconColor: "text-accent",
    },
    {
      icon: BarChart3,
      title: "Pro Statistics",
      description: "Detailed analytics on your performance to help you level up.",
      glow: "shadow-neon-cyan/10",
      iconColor: "text-primary",
    },
    {
      icon: Award,
      title: "Hall of Fame",
      description: "Unlock premium badges and achievements as you master new topics.",
      glow: "shadow-neon-magenta/10",
      iconColor: "text-secondary",
    },
    {
      icon: Users,
      title: "Versus Mode",
      description: "Challenge friends directly and see who truly owns the arena.",
      glow: "shadow-neon-lime/10",
      iconColor: "text-accent",
    },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16">
          <h2 className={cn("text-4xl font-black tracking-tighter sm:text-6xl mb-4", getGradientText("neon"))}>
            BUILT FOR THE CHASE
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground font-medium">
            Everything you need to dominate the sports trivia world.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={cn(
                  "group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-8 transition-all duration-300",
                  "hover:border-primary/20 hover:bg-white/10 hover:-translate-y-2 hover:shadow-glass-lg",
                  feature.glow
                )}
              >
                {/* Decorative background glow */}
                <div className={cn("absolute -right-8 -bottom-8 h-32 w-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity", feature.iconColor)} />

                <div className="relative flex flex-col gap-6">
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl glass-elevated border-white/10 p-3",
                    feature.iconColor
                  )}>
                    <Icon className="h-full w-full" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
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
