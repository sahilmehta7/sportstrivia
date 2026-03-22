"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ShowcaseFilterOption } from "@/components/showcase/ui/FilterBar";
import {
  StickyQuizPickRail,
  type StickyQuizPickRailSelection,
} from "@/components/quizzes/sticky-quiz-pick-rail";
import { buildQuizzesPath } from "@/app/quizzes/client-query-utils";

interface StickyQuizPickRailShellProps {
  options: ShowcaseFilterOption[];
  personalizedTopicSlug?: string;
}

export function StickyQuizPickRailShell({
  options,
  personalizedTopicSlug,
}: StickyQuizPickRailShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const pushWithQuery = (
    input: Parameters<typeof buildQuizzesPath>[1]
  ) => {
    const nextPath = buildQuizzesPath(
      new URLSearchParams(searchParams.toString()),
      input
    );
    startTransition(() => {
      router.push(nextPath, { scroll: false });
    });
  };

  const handleQuickPickSelect = (selection: StickyQuizPickRailSelection) => {
    if (selection.type === "all") {
      window.localStorage.removeItem("quizzes:lastTopicSlug");
      pushWithQuery({
        remove: ["topic", "sport"],
      });
      return;
    }

    window.localStorage.setItem("quizzes:lastTopicSlug", selection.topicSlug);
    pushWithQuery({
      set: { topic: selection.topicSlug },
      remove: ["sport"],
    });
  };

  return (
    <StickyQuizPickRail
      options={options}
      personalizedTopicSlug={personalizedTopicSlug}
      isPending={isPending}
      onSelect={handleQuickPickSelect}
    />
  );
}
