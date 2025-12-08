"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { ArrowRight, Play } from "lucide-react";

export function FinalCTA() {
  // Theme styling handled via CSS

  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-4xl">
        <div className={cn(
          "relative rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 lg:p-12 text-center backdrop-blur-xl",
          getGlassCard()
        )}>
          <h2 className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6",
            getTextColor("primary")
          )}>
            Ready to Test Your Sports Knowledge?
          </h2>

          <p className={cn(
            "text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto",
            getTextColor("secondary")
          )}>
            Join thousands of sports fans who challenge themselves daily.
            Start your trivia journey today and climb the leaderboards!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link href="/auth/signin">
              <Button
                size="lg"
                className={cn(
                  "w-full sm:min-w-[200px] gap-2 text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-105",
                  "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25",
                  "dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white dark:shadow-lg dark:shadow-emerald-600/25"
                )}
              >
                Get Started Now
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>

            <Link href="/quizzes">
              <Button
                size="lg"
                variant="outline"
                className={cn(
                  "w-full sm:min-w-[200px] gap-2 text-base sm:text-lg font-semibold backdrop-blur-sm transition-all duration-200 hover:scale-105",
                  "border-blue-200 bg-white/60 text-blue-700 hover:bg-blue-50",
                  "dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                )}
              >
                Browse Quizzes
                <Play className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
            <p className={cn(
              "text-xs sm:text-sm",
              getTextColor("muted")
            )}>
              Free to join • No credit card required • Start playing instantly
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
