"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ShowcaseFilterGroup, ShowcaseFilterOption } from "@/components/showcase/ui/FilterBar";

interface FilterBarProps {
  groups: ShowcaseFilterGroup[];
  className?: string;
  onChange?: (groupId: string, option: ShowcaseFilterOption) => void;
  isPending?: boolean;
}

export function FilterBar({ groups, className, onChange, isPending }: FilterBarProps) {
  return (
    <div className={cn("w-full border-b-2 border-foreground/5 bg-background pb-8", className)}>
      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <div key={group.id} className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">{group.label}</span>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isActive = option.value === group.activeValue ||
                  (group.activeValue === undefined && option.value === "all");

                return (
                  <button
                    key={option.value}
                    disabled={isPending}
                    onClick={() => onChange?.(group.id, option)}
                    className={cn(
                      "group flex items-center gap-3 px-6 py-2.5 transition-all duration-300",
                      "text-xs font-bold uppercase tracking-widest",
                      "border-2",
                      isActive
                        ? "bg-foreground text-background border-foreground shadow-athletic"
                        : "bg-background text-foreground/40 border-foreground/5 hover:border-foreground/20 hover:text-foreground",
                      isPending && "cursor-wait opacity-80"
                    )}
                  >
                    {isActive && isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-background/60" />
                    ) : (
                      option.emoji && <span className={cn("text-base transition-opacity", isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100")}>{option.emoji}</span>
                    )}
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className={cn(
                        "ml-2 text-[9px] px-1.5 py-0.5 border-l transition-colors",
                        isActive ? "border-background/20 text-background/60" : "border-foreground/10 text-muted-foreground/40"
                      )}>
                        {option.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
