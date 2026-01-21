"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { ArrowRight, Trophy } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:py-24 lg:pb-32">
      <div className="mx-auto max-w-5xl">
        <div className={cn(
          "relative rounded-[3rem] p-8 sm:p-12 lg:p-20 text-center overflow-hidden",
          "glass-elevated border-primary/20 shadow-glass-lg"
        )}>
          {/* Decorative background glow elements */}
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse-glow pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full glass border-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              <Trophy className="h-4 w-4" /> Final Boss Level
            </div>

            <h2 className={cn(
              "text-5xl sm:text-7xl font-black tracking-tighter leading-[0.9]",
              getGradientText("neon")
            )}>
              ARE YOU READY <br /> FOR THE ARENA?
            </h2>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed">
              Join thousands of elite sports fans who challenge their instincts daily.
              Your legacy starts the moment you enter the arena.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  variant="neon"
                  className="w-full sm:min-w-[240px] gap-3 font-black uppercase tracking-widest text-lg"
                >
                  Enter Arena Now
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>

              <Link href="/quizzes" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  variant="glass"
                  className="w-full sm:min-w-[240px] gap-3 font-black uppercase tracking-widest text-lg"
                >
                  Watch Replays
                </Button>
              </Link>
            </div>

            <div className="pt-10 border-t border-white/5">
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-neon-cyan" /> Free Entrance</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-neon-magenta" /> Daily Challenges</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent shadow-neon-lime" /> Global Rankings</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
