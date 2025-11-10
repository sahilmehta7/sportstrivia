import { cn } from "@/lib/utils";
import { ShowcaseQuizCarousel } from "@/components/quiz/ShowcaseQuizCarousel";
import { getFeaturedQuizzes } from "@/lib/services/home-page.service";

export async function FeaturedQuizzes() {
  const quizzes = await getFeaturedQuizzes();

  if (!quizzes || quizzes.length === 0) {
    return null;
  }

  // Transform quizzes to match ShowcaseQuizCarousel format
  const carouselItems = quizzes.map((quiz) => {
    const durationMinutes = typeof quiz.duration === "number" && quiz.duration > 0
      ? Math.max(1, Math.round(quiz.duration / 60))
      : null;

    return {
      id: quiz.id,
      title: quiz.title,
      badgeLabel: quiz.isFeatured ? "Featured" : "Quiz",
      durationLabel: durationMinutes ? `${durationMinutes} min` : "Flexible",
      playersLabel: `${quiz._count?.attempts || 0} players`,
      accent: "#7c2d12", // Default accent color
      coverImageUrl: quiz.descriptionImageUrl,
      href: quiz.slug ? `/quizzes/${quiz.slug}` : `/quizzes/${quiz.id}`,
    };
  });

  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div
          className={cn(
            "relative mx-auto mb-8 w-full max-w-5xl rounded-[1.75rem] border p-6 sm:p-8 backdrop-blur-xl",
            "border-slate-200/50 bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]",
            "dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          )}
        >
          <div className="text-center">
            <h2
              className={cn(
                "mb-4 text-2xl font-bold sm:text-3xl",
                "text-slate-900",
                "dark:text-white"
              )}
            >
              Featured Quizzes
            </h2>
            <p
              className={cn(
                "text-base sm:text-lg",
                "text-slate-700",
                "dark:text-white/80"
              )}
            >
              Hand-picked quizzes to challenge your sports knowledge
            </p>
          </div>
        </div>
        
        <ShowcaseQuizCarousel items={carouselItems} />
      </div>
    </section>
  );
}