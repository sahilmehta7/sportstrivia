"use client";

import { Bookmark } from "lucide-react";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getChipStyles, getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

export interface SavedFilter {
  id: string;
  label: string;
  description?: string;
  emoji?: string;
}

interface ShowcaseSavedFiltersProps {
  filters: SavedFilter[];
  onSelect?: (filter: SavedFilter) => void;
  onManageClick?: () => void;
  className?: string;
}

export function ShowcaseSavedFilters({ filters, onSelect, onManageClick, className }: ShowcaseSavedFiltersProps) {
  const { theme } = useShowcaseTheme();

  if (!filters.length) return null;

  return (
    <div className={cn("rounded-[2rem] p-4", getSurfaceStyles(theme, "base"), className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className={cn("text-xs font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
          Saved Filters
        </span>
        <button onClick={onManageClick} className={cn("text-[10px] uppercase tracking-[0.3em]", getTextColor(theme, "muted"))}>
          Manage
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onSelect?.(filter)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
              getChipStyles(theme, "outline")
            )}
          >
            <Bookmark className="h-3 w-3" />
            {filter.emoji && <span aria-hidden="true">{filter.emoji}</span>}
            <span>{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
