import { auth } from "@/lib/auth";
import { ContinueCollectionRail } from "@/components/collections/CollectionRail";
import { listUserInProgressCollections } from "@/lib/services/collection.service";

export async function ContinueCollectionsSection() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const items = await listUserInProgressCollections(userId);
  if (items.length === 0) return null;

  return (
    <ContinueCollectionRail
      title="Continue Collections"
      subtitle="Pick up your in-progress quiz journeys where you left off."
      items={items}
    />
  );
}

export function ContinueCollectionsSectionSkeleton() {
  return <div className="h-48 animate-pulse rounded-2xl border border-foreground/10 bg-muted/10" />;
}
