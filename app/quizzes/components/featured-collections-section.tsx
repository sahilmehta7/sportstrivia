import { CollectionRail } from "@/components/collections/CollectionRail";
import { listPublishedCollectionsSafe } from "@/lib/services/collection.service";

export async function FeaturedCollectionsSection() {
  const payload = await listPublishedCollectionsSafe(
    {
      page: 1,
      limit: 6,
      featured: true,
    },
    "quizzes/featured-collections-section"
  );

  return (
    <CollectionRail
      title="Featured Collections"
      subtitle="Curated quiz journeys designed for binge-worthy play."
      items={payload.collections}
    />
  );
}

export function FeaturedCollectionsSectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted/10 rounded animate-pulse" />
        <div className="h-4 w-96 bg-muted/10 rounded animate-pulse" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-[300px] sm:w-[350px] aspect-[4/5] shrink-0 bg-muted/5 border-2 border-border/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
