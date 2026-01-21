"use client";

import { getGlassCard, getTextColor, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Search, Play, Trophy } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Select Arena",
      description: "Browse the playbook and pick the arena that fits your expertise.",
      color: "text-primary",
      glow: "shadow-neon-cyan/20",
    },
    {
      icon: Play,
      title: "Show Mastery",
      description: "Tackle premium questions across different difficulty tiers.",
      color: "text-secondary",
      glow: "shadow-neon-magenta/20",
    },
    {
      icon: Trophy,
      title: "Claim Glory",
      description: "Dominate the global rankings and earn your championship status.",
      color: "text-accent",
      glow: "shadow-neon-lime/20",
    },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 text-center">
          <h2 className={cn("text-4xl font-black tracking-tighter sm:text-6xl mb-4", getGradientText("neon"))}>
            THE ROAD TO GLORY
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground font-medium">
            Three steps to go from a rookie to a trivia legend.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 sm:gap-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative flex flex-col items-center group"
              >
                {/* Connection line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-14 left-[calc(50%+4rem)] w-[calc(100%-8rem)] h-[1px] bg-gradient-to-r from-primary/30 to-transparent" />
                )}

                {/* Step indicator */}
                <div className="absolute -top-6 flex h-12 w-12 items-center justify-center rounded-full glass-elevated border-primary/20 text-primary font-black shadow-neon-cyan z-10 transition-transform group-hover:scale-110">
                  0{index + 1}
                </div>

                {/* Icon card */}
                <div className={cn(
                  "relative rounded-[2.5rem] p-10 text-center glass border-white/5 transition-all duration-500",
                  "group-hover:border-primary/20 group-hover:bg-white/5",
                  step.glow
                )}>
                  <div className="flex justify-center mb-8">
                    <div className="relative">
                      <div className={cn("absolute inset-0 rounded-full blur-2xl opacity-20", step.color)} />
                      <div className="relative rounded-2xl glass-elevated border-white/10 p-6">
                        <Icon className={cn("h-12 w-12", step.color)} />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black tracking-tight mb-4">
                    {step.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
