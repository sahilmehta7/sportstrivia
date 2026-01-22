import { cn } from "@/lib/utils";
import { ShowcaseQuizCarousel } from "@/components/quiz/ShowcaseQuizCarousel";
import { getFeaturedQuizzes } from "@/lib/services/home-page.service";
import { getGradientText } from "@/lib/showcase-theme";
import { ShieldCheck } from "lucide-react";

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
      durationLabel: durationMinutes ? `${durationMinutes} MIN` : "FLEX",
      playersLabel: `${(quiz._count?.attempts || 0).toLocaleString()} PLAYERS`,
      accent: quiz.isFeatured ? "hsl(var(--accent))" : "hsl(var(--primary))",
      coverImageUrl: quiz.descriptionImageUrl,
      href: quiz.slug ? `/quizzes/${quiz.slug}` : `/quizzes/${quiz.id}`,
    };
  });

  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 border border-foreground/10 px-4 py-1.5 bg-muted/30">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Premier Access</span>
            </div>
            <h2 className={cn(
              "text-5xl sm:text-7xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]",
              getGradientText("editorial")
            )}>
              FEATURED ARENAS
            </h2>
            <p className="max-w-2xl text-lg text-muted-foreground font-semibold uppercase tracking-tight">
              Hand-picked challenges for elite trivia players. Proven intelligence required.
            </p>
          </div>
        </div>

        <ShowcaseQuizCarousel items={carouselItems} />
      </div>
    </section>
  );
}