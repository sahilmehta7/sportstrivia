"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getInputStyles, getChipStyles, getSurfaceStyles } from "@/lib/showcase-theme";

export interface ShowcaseSearchChip {
  value: string;
  label: string;
  emoji?: string;
  active?: boolean;
}

interface ShowcaseSearchBarProps {
  value?: string;
  placeholder?: string;
  actionLabel?: string;
  chips?: ShowcaseSearchChip[];
  showAdvancedButton?: boolean;
  className?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onAdvancedClick?: () => void;
  onChipToggle?: (chip: ShowcaseSearchChip, nextActive: boolean) => void;
}

export function ShowcaseSearchBar({
  value,
  placeholder = "Search quizzes, teams, or creators...",
  actionLabel = "Search",
  chips = [],
  showAdvancedButton = false,
  className,
  onValueChange,
  onSubmit,
  onAdvancedClick,
  onChipToggle,
}: ShowcaseSearchBarProps) {
  const { theme } = useShowcaseTheme();
  const [internalValue, setInternalValue] = useState("");

  const currentValue = value ?? internalValue;

  const inputClasses = useMemo(() => getInputStyles(theme), [theme]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(currentValue.trim());
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (value === undefined) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  return (
    <div
      className={cn(
        "w-full space-y-4 rounded-[2rem] border px-6 py-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)]",
        getSurfaceStyles(theme, "raised"),
        className
      )}
    >
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <div className="relative flex min-w-[240px] flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
          <Input
            value={currentValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={cn(
              "h-12 rounded-full pl-9 pr-12 text-sm shadow-none",
              inputClasses,
              theme === "dark" ? "bg-white/8" : "bg-white"
            )}
          />
          <Button type="submit" size="icon" variant="ghost" className="absolute right-2 h-8 w-8 rounded-full">
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
        <Button type="submit" className="rounded-full px-5 text-sm font-semibold uppercase tracking-[0.3em]">
          {actionLabel}
        </Button>
        {showAdvancedButton && (
          <Button
            type="button"
            variant="outline"
            onClick={onAdvancedClick}
            className="rounded-full border-dashed"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Advanced Filters
          </Button>
        )}
      </form>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = Boolean(chip.active);
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => onChipToggle?.(chip, !active)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                  active ? getChipStyles(theme, "solid") : getChipStyles(theme, "outline")
                )}
              >
                {chip.emoji && <span aria-hidden="true">{chip.emoji}</span>}
                {chip.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
