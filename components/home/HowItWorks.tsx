"use client";

import { getTextColor, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Search, Play, Trophy, ArrowRight } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Select Arena",
      description: "Browse the pro playbook and pick the arena that fits your expertise.",
      color: "text-primary",
    },
    {
      icon: Play,
      title: "Show Mastery",
      description: "Tackle high-performance questions across different difficulty tiers.",
      color: "text-accent",
    },
    {
      icon: Trophy,
      title: "Claim Glory",
      description: "Dominate the global rankings and earn your championship status.",
      color: "text-primary",
    },
  ];

  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="mb-24 text-left border-l-8 border-foreground pl-8">
          <h2 className={cn(
            "text-5xl sm:text-7xl font-bold tracking-tighter uppercase mb-4 font-['Barlow_Condensed',sans-serif]",
            getGradientText("editorial")
          )}>
            THE ROAD TO GLORY
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground font-semibold uppercase tracking-wide">
            A three-stage protocol for knowledge dominance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative flex flex-col group"
              >
                {/* Connection arrows for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center h-12 w-12 rounded-full bg-background border-2 border-border shadow-athletic">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className={cn(
                  "relative h-full flex flex-col items-start p-10 bg-background border-2 border-border transition-all duration-300",
                  "hover:border-foreground hover:translate-y-[-8px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
                )}>
                  {/* Step indicator */}
                  <div className="mb-8 flex h-14 w-14 items-center justify-center bg-foreground text-background font-bold text-xl">
                    {index + 1}
                  </div>

                  <div className="mb-6">
                    <div className="relative">
                      <div className={cn("relative p-4 bg-muted/50 border border-border")}>
                        <Icon className={cn("h-8 w-8", step.color)} />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold tracking-tighter mb-4 font-['Barlow_Condensed',sans-serif] uppercase leading-none">
                    {step.title}
                  </h3>

                  <p className="text-base leading-relaxed text-muted-foreground font-medium mb-8">
                    {step.description}
                  </p>

                  <div className="mt-auto pt-4 w-full flex justify-between items-center border-t border-border group-hover:border-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-foreground">Phase {index + 1}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-accent transform transition-transform group-hover:translate-x-1" />
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
