"use client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getChipStyles, getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

export interface ShowcaseFilterOption {
  value: string;
  label: string;
  count?: number;
  emoji?: string;
}

export interface ShowcaseFilterGroup {
  id: string;
  label: string;
  type?: "pill" | "select";
  options: ShowcaseFilterOption[];
  activeValue?: string;
}

interface ShowcaseFilterBarProps {
  groups: ShowcaseFilterGroup[];
  className?: string;
  condensed?: boolean;
  onChange?: (groupId: string, option: ShowcaseFilterOption) => void;
  onReset?: () => void;
}

export function ShowcaseFilterBar({ groups, className, condensed = false, onChange, onReset }: ShowcaseFilterBarProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div
      className={cn(
        "w-full rounded-[1.75rem] border px-5 py-4 md:px-7 md:py-5",
        getSurfaceStyles(theme, "base"),
        className
      )}
    >
      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const type = group.type ?? (condensed ? "select" : "pill");
          if (type === "select") {
            return (
              <div key={group.id} className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <span className={cn("text-sm font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
                  {group.label}
                </span>
                <Select
                  value={group.activeValue}
                  onValueChange={(value) => {
                    const option = group.options.find((opt) => opt.value === value);
                    if (option) {
                      onChange?.(group.id, option);
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-full md:w-60">
                    <SelectValue placeholder={`Select ${group.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.emoji && <span aria-hidden="true">{option.emoji}</span>}
                          <span>{option.label}</span>
                          {typeof option.count === "number" && (
                            <span className="text-xs text-muted-foreground">({option.count})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          return (
            <div key={group.id} className="space-y-2">
              <span className={cn("text-sm font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
                {group.label}
              </span>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const active = option.value === group.activeValue;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      onClick={() => onChange?.(group.id, option)}
                      className={cn(
                        "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]",
                        active ? getChipStyles(theme, "solid") : getChipStyles(theme, "outline")
                      )}
                    >
                      {option.emoji && <span aria-hidden="true" className="mr-1">{option.emoji}</span>}
                      {option.label}
                      {typeof option.count === "number" && (
                        <span className="ml-1 text-[10px] opacity-80">{option.count}</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {onReset && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.3em]",
                getTextColor(theme, "muted"),
                "hover:opacity-80"
              )}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
