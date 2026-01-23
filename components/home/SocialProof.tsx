"use client";

import { getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Trophy, Users, BookOpen, Star, ShieldCheck } from "lucide-react";

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
      label: "PRO QUIZZES",
      iconColor: "text-primary",
    },
    {
      icon: Users,
      value: `${stats.activeUsers.toLocaleString()}+`,
      label: "ATHLETES",
      iconColor: "text-accent",
    },
    {
      icon: Trophy,
      value: `${stats.questionsAnswered.toLocaleString()}+`,
      label: "RESPONSES",
      iconColor: "text-primary",
    },
    {
      icon: Star,
      value: `${stats.averageRating.toFixed(1)}/5`,
      label: "PRO RATING",
      iconColor: "text-accent",
    },
  ];

  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 border border-foreground/10 px-4 py-1.5 bg-background">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Verified Ecosystem</span>
          </div>
          <h2 className={cn(
            "text-5xl sm:text-7xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]",
            getGradientText("editorial")
          )}>
            TRUSTED BY THE BEST
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground font-semibold uppercase tracking-tight">
            Join thousands of fans in the world&apos;s most competitive sports trivia arena.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/10 border-2 border-foreground/10">
          {socialProofItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={cn(
                  "relative group bg-background p-12 text-center transition-all duration-300",
                  "hover:bg-muted/50"
                )}
              >
                <div className="flex justify-center mb-8">
                  <div className="relative bg-foreground text-background p-5">
                    <Icon className="h-8 w-8" />
                  </div>
                </div>

                <div className="text-5xl font-bold tracking-tighter mb-2 font-['Barlow_Condensed',sans-serif] uppercase">
                  {item.value}
                </div>

                <div className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
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
