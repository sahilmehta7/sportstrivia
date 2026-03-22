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
  return <div className="h-48 animate-pulse border border-foreground/10 bg-muted/10" />;
}
