import { CollectionRail } from "@/components/collections/CollectionRail";
import { listPublishedCollections } from "@/lib/services/collection.service";

export async function FeaturedCollectionsSection() {
  const payload = await listPublishedCollections({
    page: 1,
    limit: 6,
    featured: true,
  });

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
