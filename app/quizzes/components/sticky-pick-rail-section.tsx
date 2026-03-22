import { auth } from "@/lib/auth";
import {
  type SearchParams,
  getFilterGroups,
  getPersonalizedTopicSlug,
} from "@/app/quizzes/quiz-utils";
import { StickyQuizPickRailShell } from "@/components/quizzes/sticky-quiz-pick-rail-shell";

export async function StickyPickRailSection({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const [filterGroups, personalizedTopicSlug] = await Promise.all([
    getFilterGroups(searchParams),
    getPersonalizedTopicSlug(userId),
  ]);

  const categoryGroup = filterGroups.find((group) => group.id === "category");
  if (!categoryGroup) return null;

  return (
    <StickyQuizPickRailShell
      options={categoryGroup.options}
      personalizedTopicSlug={personalizedTopicSlug}
    />
  );
}

export function StickyPickRailSectionSkeleton() {
  return <div className="h-[58px] animate-pulse border-y border-foreground/10 bg-muted/10" />;
}
