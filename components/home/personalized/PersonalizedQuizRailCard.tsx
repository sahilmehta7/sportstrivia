import type { PersonalizedHomeQuizItem } from "@/types/personalized-home";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";

type PersonalizedQuizRailCardProps = {
  item: PersonalizedHomeQuizItem;
  className?: string;
};

export function PersonalizedQuizRailCard({ item, className }: PersonalizedQuizRailCardProps) {
  const durationLabel = item.estimatedDuration
    ? `${Math.max(1, Math.ceil(item.estimatedDuration / 60))} MIN`
    : "FLEX";
  const difficultyLabel = item.difficulty.replaceAll("_", " ");

  return (
    <ShowcaseQuizCard
      id={item.quizId}
      title={item.title}
      metaPrimaryLabel="Duration"
      metaPrimaryValue={durationLabel}
      metaTertiaryLabel="Difficulty"
      metaTertiaryValue={difficultyLabel}
      durationLabel={durationLabel}
      coverImageUrl={item.coverImageUrl}
      href={`/quizzes/${item.slug}`}
      className={className}
    />
  );
}
