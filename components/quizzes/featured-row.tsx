import { ShowcaseFeaturedQuizCard } from "@/components/quiz/ShowcaseFeaturedQuizCard";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

interface FeaturedRowProps {
  title: string;
  description?: string;
  quizzes: PublicQuizListItem[];
}

export function FeaturedRow({ title, description, quizzes }: FeaturedRowProps) {
  if (quizzes.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold uppercase tracking-tight font-['Barlow_Condensed',sans-serif]">{title}</h3>
        {description && <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-8">
        {quizzes.map((quiz) => {
          const durationLabel = quiz.duration ? `${Math.round(quiz.duration / 60)} MIN` : "FLEX";
          const playersLabel = `${(quiz._count?.attempts || 0).toLocaleString()} PLAYERS`;
          const ratingLabel = (quiz.averageRating ?? 0).toFixed(1);

          return (
            <ShowcaseFeaturedQuizCard
              key={quiz.id}
              title={quiz.title}
              subtitle={quiz.description}
              category={quiz.sport || "Quiz"}
              durationLabel={durationLabel}
              difficultyLabel={quiz.difficulty}
              playersLabel={playersLabel}
              ratingLabel={ratingLabel}
              coverImageUrl={quiz.descriptionImageUrl}
              ctaHref={`/quizzes/${quiz.slug}`}
              ctaLabel="PLAY NOW"
            />
          );
        })}
      </div>
    </section>
  );
}
