import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/PageContainer";
import { CollectionRail } from "@/components/collections/CollectionRail";
import { listPublishedCollections } from "@/lib/services/collection.service";

export const metadata: Metadata = {
  title: "Collections | Sports Trivia",
  description: "Browse curated sports trivia collections and continue your quiz journeys.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const payload = await listPublishedCollections({
    page: 1,
    limit: 24,
  });

  return (
    <main className="min-h-screen pb-24">
      <PageContainer className="pt-6 md:pt-12">
        <CollectionRail
          title="Collections"
          subtitle="Guided quiz journeys organized by sport, team, event, and challenge style."
          items={payload.collections}
        />
      </PageContainer>
    </main>
  );
}
