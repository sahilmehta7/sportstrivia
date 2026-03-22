"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { ArrowRight, Trophy, Target } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:py-40 bg-foreground text-background overflow-hidden relative">
      {/* Editorial Decorative Elements */}
      <div className="absolute top-0 right-0 p-12 opacity-10">
        <Trophy className="h-64 w-64" />
      </div>
      <div className="absolute bottom-0 left-0 p-12 opacity-10">
        <Target className="h-64 w-64" />
      </div>

      <div className="mx-auto max-w-5xl relative z-10 text-center">
        <div className="space-y-12">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 border-2 border-accent px-4 py-2 sm:gap-3 sm:px-6">
            <Trophy className="h-5 w-5 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent sm:text-xs sm:tracking-[0.3em]">
              Season One: Open Enrollment
            </span>
          </div>

          <h2 className={cn(
            "break-words text-5xl font-bold tracking-tighter leading-[0.85] sm:text-7xl lg:text-9xl font-['Barlow_Condensed',sans-serif] uppercase"
          )}>
            THE ARENA <br className="sm:hidden" /> AWAITS <br /> YOUR LEGACY
          </h2>

          <p className="mx-auto max-w-2xl text-xl sm:text-2xl text-background/80 font-medium leading-relaxed uppercase tracking-tight">
            Join thousands of elite sports fans who challenge their instincts daily.
            Your legacy starts the moment you enter the quiz.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Link href="/auth/signin" className="w-full sm:w-auto">
              <Button
                size="xl"
                variant="accent"
                className="w-full sm:min-w-[280px] gap-4 font-bold uppercase tracking-widest text-xl rounded-none py-8 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]"
              >
                Enter Quiz Now
                <ArrowRight className="h-6 w-6" />
              </Button>
            </Link>

            <Link href="/quizzes" className="w-full sm:w-auto">
              <Button
                size="xl"
                variant="outline"
                className="w-full sm:min-w-[280px] gap-4 font-bold uppercase tracking-widest text-xl rounded-none py-8 border-background text-background hover:bg-background hover:text-foreground"
              >
                Explore Catalog
              </Button>
            </Link>
          </div>

          <div className="pt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { label: "Free Enrollment", value: "Verified" },
                { label: "Daily Drills", value: "Live Now" },
                { label: "Global Rankings", value: "Pro Tier" }
              ].map((stat, i) => (
                <div key={i} className="space-y-1 border-t-2 border-background/20 pt-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/40">{stat.value}</div>
                  <div className="text-sm font-bold uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
