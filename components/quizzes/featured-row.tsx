import { FeaturedCard } from "@/components/quizzes/featured-card";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

interface FeaturedRowProps {
  title: string;
  description?: string;
  quizzes: PublicQuizListItem[];
}

export function FeaturedRow({ title, description, quizzes }: FeaturedRowProps) {
  if (quizzes.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="w-[22rem] flex-none">
              <FeaturedCard quiz={quiz} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
