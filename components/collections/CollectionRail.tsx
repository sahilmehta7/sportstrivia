import { CollectionCard } from "@/components/collections/CollectionCard";

type CollectionRailItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  type: string;
  quizCount: number;
  previewQuizzes?: Array<{
    order: number;
    quiz: {
      id: string;
      slug: string;
      title: string;
      difficulty: string;
      sport: string | null;
      descriptionImageUrl: string | null;
    };
  }>;
};

type ContinueRailItem = {
  collectionId: string;
  collection: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    coverImageUrl: string | null;
    type: string;
    totalQuizzes: number;
  };
  progress: {
    completedQuizCount: number;
  };
  nextQuiz: {
    id: string;
    slug: string;
    title: string;
    order: number;
  } | null;
};

type CollectionRailProps = {
  title: string;
  subtitle?: string;
  items: CollectionRailItem[];
};

export function CollectionRail({ title, subtitle, items }: CollectionRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <CollectionCard
            key={item.id}
            collection={{
              id: item.id,
              name: item.name,
              slug: item.slug,
              description: item.description,
              coverImageUrl: item.coverImageUrl,
              type: item.type,
              quizCount: item.quizCount,
              previewQuizzes: item.previewQuizzes,
            }}
          />
        ))}
      </div>
    </section>
  );
}

type ContinueCollectionRailProps = {
  title: string;
  subtitle?: string;
  items: ContinueRailItem[];
};

export function ContinueCollectionRail({
  title,
  subtitle,
  items,
}: ContinueCollectionRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <CollectionCard
            key={item.collectionId}
            collection={{
              id: item.collection.id,
              name: item.collection.name,
              slug: item.collection.slug,
              description: item.collection.description,
              coverImageUrl: item.collection.coverImageUrl,
              type: item.collection.type,
              quizCount: item.collection.totalQuizzes,
            }}
            nextQuiz={item.nextQuiz}
            completedQuizCount={item.progress.completedQuizCount}
            totalQuizzes={item.collection.totalQuizzes}
          />
        ))}
      </div>
    </section>
  );
}
