"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getChipStyles, getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

export interface TagCloudTag {
  value: string;
  label: string;
  count?: number;
  active?: boolean;
}

interface ShowcaseTagCloudProps {
  tags: TagCloudTag[];
  onToggle?: (tag: TagCloudTag, nextState: boolean) => void;
  className?: string;
}

export function ShowcaseTagCloud({ tags, onToggle, className }: ShowcaseTagCloudProps) {
  const { theme } = useShowcaseTheme();

  if (!tags.length) return null;

  return (
    <div className={cn("rounded-[2rem] p-4", getSurfaceStyles(theme, "base"), className)}>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = Boolean(tag.active);
          return (
            <button
              key={tag.value}
              type="button"
              onClick={() => onToggle?.(tag, !active)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                active ? getChipStyles(theme, "solid") : getChipStyles(theme, "outline")
              )}
            >
              {tag.label}
              {typeof tag.count === "number" && (
                <span className={cn("text-[10px]", getTextColor(theme, "muted"))}>{tag.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
