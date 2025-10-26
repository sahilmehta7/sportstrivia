"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { ArrowRight, Play } from "lucide-react";

export function FinalCTA() {
  const { theme } = useShowcaseTheme();

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-4xl">
        <div className={cn(
          "relative rounded-[2rem] p-8 sm:p-12 text-center backdrop-blur-xl",
          getGlassCard(theme)
        )}>
          <h2 className={cn(
            "text-3xl sm:text-4xl font-bold mb-6",
            getTextColor(theme, "primary")
          )}>
            Ready to Test Your Sports Knowledge?
          </h2>
          
          <p className={cn(
            "text-lg mb-8 max-w-2xl mx-auto",
            getTextColor(theme, "secondary")
          )}>
            Join thousands of sports fans who challenge themselves daily. 
            Start your trivia journey today and climb the leaderboards!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signin">
              <Button 
                size="lg" 
                className={cn(
                  "min-w-[200px] gap-2 text-lg font-semibold transition-all duration-200 hover:scale-105",
                  theme === "light"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                )}
              >
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/quizzes">
              <Button 
                size="lg" 
                variant="outline"
                className={cn(
                  "min-w-[200px] gap-2 text-lg font-semibold backdrop-blur-sm transition-all duration-200 hover:scale-105",
                  theme === "light"
                    ? "border-blue-200 bg-white/60 text-blue-700 hover:bg-blue-50"
                    : "border-white/20 bg-white/5 text-white hover:bg-white/10"
                )}
              >
                Browse Quizzes
                <Play className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className={cn(
              "text-sm",
              getTextColor(theme, "muted")
            )}>
              Free to join • No credit card required • Start playing instantly
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
