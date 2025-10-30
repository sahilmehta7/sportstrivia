"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ShowcaseFilterGroup, ShowcaseFilterOption } from "@/components/showcase/ui/FilterBar";

interface FilterBarProps {
  groups: ShowcaseFilterGroup[];
  className?: string;
  onChange?: (groupId: string, option: ShowcaseFilterOption) => void;
  onReset?: () => void;
}

export function FilterBar({ groups, className, onChange, onReset }: FilterBarProps) {
  return (
    <div className={cn("w-full rounded-xl border bg-card p-4", className)}>
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.id} className="space-y-2">
            <span className="text-sm font-semibold text-foreground">{group.label}</span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {group.options.map((option) => {
                const isActive = option.value === group.activeValue || 
                  (group.activeValue === undefined && option.value === "all");
                
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
                      isActive 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => onChange?.(group.id, option)}
                  >
                    {option.emoji && <span className="mr-1">{option.emoji}</span>}
                    {option.label}
                    {option.count !== undefined && (
                      <Badge 
                        variant="secondary" 
                        className="ml-1 h-4 px-1 text-[10px] bg-muted text-muted-foreground"
                      >
                        {option.count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
