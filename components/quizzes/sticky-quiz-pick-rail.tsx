"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ShowcaseFilterOption } from "@/components/showcase/ui/FilterBar";

export type StickyQuizPickRailSelection =
  | { type: "all" }
  | { type: "topic"; topicSlug: string }
  | { type: "for-you"; topicSlug: string };

interface StickyQuizPickRailProps {
  options: ShowcaseFilterOption[];
  personalizedTopicSlug?: string;
  onSelect: (selection: StickyQuizPickRailSelection) => void;
  isPending?: boolean;
}

function isOptionActive(
  option: ShowcaseFilterOption,
  topicParam: string | null,
  sportParam: string | null
): boolean {
  if (topicParam) return topicParam === option.value;
  if (!sportParam) return false;
  return (
    sportParam === option.value ||
    sportParam.toLowerCase() === option.label.toLowerCase()
  );
}

export function StickyQuizPickRail({
  options,
  personalizedTopicSlug,
  onSelect,
  isPending,
}: StickyQuizPickRailProps) {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");
  const sportParam = searchParams.get("sport");

  const sportOptions = useMemo(
    () => options.filter((option) => option.value !== "all"),
    [options]
  );

  const allActive = !topicParam && !sportParam;
  const forYouActive = Boolean(personalizedTopicSlug && topicParam === personalizedTopicSlug);

  return (
    <div className="sticky top-[72px] z-30 -mx-4 border-y border-foreground/10 bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:px-0">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
          Quick Pick
        </span>
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1 no-scrollbar">
          {personalizedTopicSlug ? (
            <button
              type="button"
              aria-pressed={forYouActive}
              disabled={isPending}
              onClick={() => onSelect({ type: "for-you", topicSlug: personalizedTopicSlug })}
              className={cn(
                "shrink-0 border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-60",
                forYouActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/15 bg-background text-foreground/75 hover:border-foreground/40 hover:text-foreground"
              )}
            >
              For You
            </button>
          ) : null}

          <button
            type="button"
            aria-pressed={allActive}
            disabled={isPending}
            onClick={() => onSelect({ type: "all" })}
            className={cn(
              "shrink-0 border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-60",
              allActive
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/15 bg-background text-foreground/75 hover:border-foreground/40 hover:text-foreground"
            )}
          >
            All
          </button>

          {sportOptions.map((option) => {
            const active = isOptionActive(option, topicParam, sportParam);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                disabled={isPending}
                onClick={() => onSelect({ type: "topic", topicSlug: option.value })}
                className={cn(
                  "shrink-0 border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/15 bg-background text-foreground/75 hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
