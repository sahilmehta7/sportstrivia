import { getRootTopics } from "@/lib/services/topic.service";
import { AllSportsTopicsWidget } from "@/components/shared/AllSportsTopicsWidget";

export async function AllSportsTopicsWidgetSection() {
  const rootTopics = await getRootTopics();

  const topics = rootTopics.map((topic: any) => ({
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
    emoji: topic.displayEmoji ?? null,
    quizCount: topic._count?.quizTopicConfigs ?? 0,
  }))
    .sort((a, b) => {
      const countDiff = (b.quizCount ?? 0) - (a.quizCount ?? 0);
      if (countDiff !== 0) return countDiff;
      return a.name.localeCompare(b.name);
    });

  return <AllSportsTopicsWidget topics={topics} />;
}

export function AllSportsTopicsWidgetSectionSkeleton() {
  return (
    <section className="space-y-6 bg-background/95 px-4 py-5 backdrop-blur sm:px-6 border border-foreground/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-muted/10 animate-pulse" />
          <div className="h-4 w-72 rounded bg-muted/10 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[80px] w-[170px] shrink-0 border border-foreground/10 bg-muted/5 animate-pulse" />
        ))}
      </div>
    </section>
  );
}
