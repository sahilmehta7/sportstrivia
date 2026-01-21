"use client";

import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

export function QuizzesPageHeader() {
  return (
    <div className="mb-8 space-y-4 text-center lg:text-left md:mb-12">
      <div className="space-y-4">
        <h1 className={cn(
          "text-5xl font-black tracking-tighter lg:text-7xl uppercase leading-[0.9]",
          getGradientText("neon")
        )}>
          EXPLORE <br className="hidden lg:block" /> THE ARENA
        </h1>
        <p className="max-w-xl mx-auto lg:mx-0 text-lg text-muted-foreground font-medium leading-relaxed">
          Test your knowledge with curated trivia challenges from the world of sports.
        </p>
      </div>
    </div>
  );
}
