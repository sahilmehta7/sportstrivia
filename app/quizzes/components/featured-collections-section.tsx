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
  return <div className="h-48 animate-pulse rounded-2xl border border-foreground/10 bg-muted/10" />;
}
