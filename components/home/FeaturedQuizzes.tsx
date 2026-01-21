import { cn } from "@/lib/utils";
import { ShowcaseQuizCarousel } from "@/components/quiz/ShowcaseQuizCarousel";
import { getFeaturedQuizzes } from "@/lib/services/home-page.service";
import { getGradientText } from "@/lib/showcase-theme";

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
      accent: "hsl(var(--neon-cyan))",
      coverImageUrl: quiz.descriptionImageUrl,
      href: quiz.slug ? `/quizzes/${quiz.slug}` : `/quizzes/${quiz.id}`,
    };
  });

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h2 className={cn("text-4xl font-black tracking-tighter sm:text-6xl mb-4", getGradientText("neon"))}>
            FEATURED ARENAS
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground font-medium">
            Hand-picked challenges for elite trivia players.
          </p>
        </div>

        <ShowcaseQuizCarousel items={carouselItems} />
      </div>
    </section>
  );
}