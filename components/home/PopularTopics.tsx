"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { ShowcaseTopTopics } from "@/components/quiz/ShowcaseTopTopics";

export function PopularTopics() {
  const { theme } = useShowcaseTheme();

  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className={cn(
          "relative w-full max-w-5xl mx-auto rounded-[1.75rem] border p-6 sm:p-8 backdrop-blur-xl mb-8",
          getGlassCard(theme)
        )}>
          <div className="text-center">
            <h2 className={cn(
              "text-2xl sm:text-3xl font-bold mb-4",
              getTextColor(theme, "primary")
            )}>
              Popular Topics
            </h2>
            <p className={cn(
              "text-base sm:text-lg",
              getTextColor(theme, "secondary")
            )}>
              Explore the most popular sports categories
            </p>
          </div>
        </div>
        
        <ShowcaseTopTopics
          title=""
          showViewAll={false}
          defaultSortBy="users"
          limit={6}
        />
      </div>
    </section>
  );
}
