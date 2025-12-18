"use client";

import { useMemo, useState, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInputStyles, getChipStyles, getSurfaceStyles } from "@/lib/showcase-theme";
import { useSearchKeyboard } from "@/hooks/use-search-keyboard";
import { trackEvent } from "@/lib/analytics";

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
  loading?: boolean;
  onValueChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onAdvancedClick?: () => void;
  onChipToggle?: (chip: ShowcaseSearchChip, nextActive: boolean) => void;
  onClear?: () => void;
  searchDescription?: string;
}

export function ShowcaseSearchBar({
  value,
  placeholder = "Search quizzes, teams, or creators...",
  actionLabel = "Search",
  chips = [],
  showAdvancedButton = false,
  className,
  loading = false,
  onValueChange,
  onSubmit,
  onAdvancedClick,
  onChipToggle,
  onClear,
  searchDescription = "Search quizzes by title, description, sport, or topic",
}: ShowcaseSearchBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchDescriptionId = useRef(`search-description-${Math.random().toString(36).substr(2, 9)}`).current;

  const currentValue = value ?? internalValue;

  const inputClasses = useMemo(() => getInputStyles(), []);

  // Handle keyboard shortcuts (/ and Ctrl/Cmd + K)
  useSearchKeyboard(inputRef, {
    enabled: true,
    onFocus: () => {
      // Select all text when focused via shortcut for easy replacement
      if (inputRef.current) {
        inputRef.current.select();
      }
    },
  });

  // Handle Escape key to clear search
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && currentValue) {
      event.preventDefault();
      if (onClear) {
        onClear();
      } else if (value === undefined) {
        setInternalValue("");
        onValueChange?.("");
      } else {
        onValueChange?.("");
      }
      inputRef.current?.blur();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = currentValue.trim();
    if (trimmed) {
      trackEvent("search", { search_term: trimmed });
      onSubmit?.(trimmed);
      setAnnouncement(`Searching for ${trimmed}`);
    }
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
        getSurfaceStyles("raised"),
        className
      )}
    >
      {/* Hidden description for screen readers */}
      <span id={searchDescriptionId} className="sr-only">
        {searchDescription}
      </span>

      {/* Aria-live region for search announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <form
        role="search"
        aria-label="Search form"
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex min-w-[240px] flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="search"
            value={currentValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search input"
            aria-describedby={searchDescriptionId}
            disabled={loading}
            maxLength={200}
            className={cn(
              "h-12 rounded-full pl-9 pr-12 text-sm shadow-none",
              inputClasses,
              "dark:bg-white/5 bg-white" // Fallback specific overriding if needed, or rely on inputClasses
            )}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={loading}
            aria-label="Submit search"
            className="absolute right-2 h-8 w-8 rounded-full"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <Button
          type="submit"
          disabled={loading}
          aria-label={loading ? "Searching..." : actionLabel}
          className="rounded-full px-5 text-sm font-semibold uppercase tracking-[0.3em]"
        >
          {loading ? "Searching..." : actionLabel}
        </Button>
        {showAdvancedButton && (
          <Button
            type="button"
            variant="outline"
            onClick={onAdvancedClick}
            disabled={loading}
            aria-label="Show advanced filters"
            className="rounded-full border-dashed"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" /> Advanced Filters
          </Button>
        )}
      </form>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Search suggestions">
          {chips.map((chip) => {
            const active = Boolean(chip.active);
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => onChipToggle?.(chip, !active)}
                disabled={loading}
                aria-pressed={active}
                aria-label={`${active ? "Remove" : "Apply"} search filter: ${chip.label}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                  active ? getChipStyles("solid") : getChipStyles("outline")
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
