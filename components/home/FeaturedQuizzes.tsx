"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { ShowcaseQuizCarousel } from "@/components/quiz/ShowcaseQuizCarousel";

interface FeaturedQuizzesProps {
  quizzes: any[];
}

export function FeaturedQuizzes({ quizzes }: FeaturedQuizzesProps) {
  const { theme } = useShowcaseTheme();

  if (!quizzes || quizzes.length === 0) {
    return null;
  }

  // Transform quizzes to match ShowcaseQuizCarousel format
  const carouselItems = quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    badgeLabel: quiz.isFeatured ? "Featured" : "Quiz",
    durationLabel: `${Math.round(quiz.duration / 60)} min`,
    playersLabel: `${quiz._count?.attempts || 0} players`,
    accent: "#7c2d12", // Default accent color
    coverImageUrl: quiz.descriptionImageUrl,
  }));

  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className={cn(
            "text-2xl sm:text-3xl font-bold mb-4",
            getTextColor(theme, "primary")
          )}>
            Featured Quizzes
          </h2>
          <p className={cn(
            "text-base sm:text-lg",
            getTextColor(theme, "secondary")
          )}>
            Hand-picked quizzes to challenge your sports knowledge
          </p>
        </div>
        
        <ShowcaseQuizCarousel items={carouselItems} />
      </div>
    </section>
  );
}
