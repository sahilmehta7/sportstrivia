import { TopicCardSkeleton } from "@/components/shared/skeletons";
import { PageContainer } from "@/components/shared/PageContainer";

export default function Loading() {
  return (
    <PageContainer className="py-8">
      <div className="mb-8">
        <div className="h-10 w-64 rounded bg-muted animate-pulse mb-4" />
        <div className="h-4 w-96 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <TopicCardSkeleton key={index} />
        ))}
      </div>
    </PageContainer>
  );
}

