"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { TopicCarousel } from "./TopicCarousel";

interface PopularTopicsProps {
  topics: any[];
}

export function PopularTopics({ topics }: PopularTopicsProps) {
  const { theme } = useShowcaseTheme();

  if (!topics || topics.length === 0) {
    return null;
  }

  // Transform topics to match TopicCarousel format
  const carouselItems = topics.map((topic) => ({
    id: topic.id,
    title: topic.name,
    description: topic.description,
    href: `/topics/${topic.slug}`,
    accentDark: "#1f2937",
    accentLight: "#f97316",
    quizCount: topic.quizCount || 0,
  }));

  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
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
        
        <TopicCarousel items={carouselItems} />
      </div>
    </section>
  );
}
