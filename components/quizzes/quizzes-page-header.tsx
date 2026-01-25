"use client";

import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import { ShieldCheck } from "lucide-react";

import { GlobalQuizSearch } from "@/components/shared/GlobalQuizSearch";

export function QuizzesPageHeader() {
  return (
    <div className="mb-12 space-y-6 text-center lg:text-left md:mb-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 border border-foreground/10 px-4 py-1.5 bg-muted/30">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Verified Content</span>
        </div>
        <h1 className={cn(
          "text-6xl font-bold tracking-tighter lg:text-8xl uppercase leading-[0.85] font-['Barlow_Condensed',sans-serif]",
          getGradientText("editorial")
        )}>
          EXPLORE <br className="hidden lg:block" /> THE ARENA
        </h1>
        <p className="max-w-xl mx-auto lg:mx-0 text-xl text-muted-foreground font-semibold uppercase tracking-tight leading-tight">
          Test your knowledge with curated trivia challenges from the world of sports. Proven performance required.
        </p>

        <div className="max-w-md mx-auto lg:mx-0 pt-4">
          <GlobalQuizSearch className="w-full" />
        </div>
      </div>
    </div>
  );
}
