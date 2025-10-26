"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { ShowcaseTopTopics } from "@/components/quiz/ShowcaseTopTopics";

interface PopularTopicsProps {
  topics: any[];
}

export function PopularTopics({ topics }: PopularTopicsProps) {
  const { theme } = useShowcaseTheme();

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className={cn(
          "relative w-full max-w-5xl mx-auto rounded-[1.75rem] border p-6 sm:p-8 backdrop-blur-xl",
          getGlassCard(theme)
        )}>
          <div className="text-center mb-8">
            <h2 className={cn(
              "text-3xl font-bold mb-4",
              getTextColor(theme, "primary")
            )}>
              Popular Topics
            </h2>
            <p className={cn(
              "text-lg",
              getTextColor(theme, "secondary")
            )}>
              Explore the most popular sports categories
            </p>
          </div>
          
          <ShowcaseTopTopics
            title=""
            showViewAll={false}
            defaultSortBy="users"
            limit={6}
          />
        </div>
      </div>
    </section>
  );
}
