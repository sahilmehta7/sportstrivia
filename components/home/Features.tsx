"use client";

import { getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Trophy,
  Calendar,
  BarChart3,
  Users,
  Award,
  Zap
} from "lucide-react";

export function Features() {
  const features = [
    {
      icon: BookOpen,
      title: "Global Playbook",
      description: "Explore 150+ quizzes across every major sport and deep-dive topics.",
      iconColor: "text-primary",
    },
    {
      icon: Trophy,
      title: "Championship Rankings",
      description: "Climb the ranks and claim your spot among the legendary sport fanatics.",
      iconColor: "text-accent",
    },
    {
      icon: Calendar,
      title: "Match Day Drill",
      description: "Fresh challenges every single day to keep your game sharp.",
      iconColor: "text-primary",
    },
    {
      icon: BarChart3,
      title: "Pro Statistics",
      description: "Detailed analytics on your performance to help you level up.",
      iconColor: "text-accent",
    },
    {
      icon: Award,
      title: "Hall of Fame",
      description: "Unlock premium badges and achievements as you master new topics.",
      iconColor: "text-primary",
    },
    {
      icon: Users,
      title: "Versus Mode",
      description: "Challenge friends directly and see who truly owns the arena.",
      iconColor: "text-accent",
    },
  ];

  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b-2 border-foreground/10 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent fill-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Pro Features</span>
            </div>
            <h2 className={cn(
              "text-5xl sm:text-7xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]",
              getGradientText("editorial")
            )}>
              BUILT FOR THE CHASE
            </h2>
          </div>
          <p className="max-w-md text-lg text-muted-foreground font-semibold uppercase tracking-tight">
            Professional-grade tools for the serious sports enthusiast.
          </p>
        </div>

        <div className="grid gap-px bg-foreground/10 border-2 border-foreground/10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 bg-background">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    "group relative overflow-hidden bg-background p-12 border-foreground/10 transition-all duration-300",
                    "hover:bg-muted/50",
                    index < 3 ? "lg:border-b" : "",
                    index % 3 !== 2 ? "lg:border-r" : "",
                    "sm:border-b lg:border-none"
                  )}
                >
                  <div className="relative flex flex-col gap-8">
                    <div className={cn(
                      "flex h-16 w-16 items-center justify-center bg-foreground text-background",
                      "group-hover:bg-accent group-hover:text-foreground transition-colors"
                    )}>
                      <Icon className="h-8 w-8" />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-3xl font-bold tracking-tighter font-['Barlow_Condensed',sans-serif] uppercase leading-none">
                        {feature.title}
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed font-medium">
                        {feature.description}
                      </p>
                    </div>

                    <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-1 w-12 bg-accent" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
