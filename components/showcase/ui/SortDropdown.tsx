"use client";

import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

export interface SortOption {
  value: string;
  label: string;
  metric?: string;
}

interface ShowcaseSortDropdownProps {
  value: string;
  options: SortOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function ShowcaseSortDropdown({ value, options, onChange, className }: ShowcaseSortDropdownProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2", getSurfaceStyles(theme, "base"), className)}>
      <span className={cn("text-xs font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
        Sort by
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 min-w-[180px] rounded-full px-3 text-xs uppercase tracking-[0.3em]">
          <SelectValue />
          <ChevronDown className="h-4 w-4 opacity-60" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span>{option.label}</span>
                {option.metric && <span className="text-xs text-muted-foreground">{option.metric}</span>}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
