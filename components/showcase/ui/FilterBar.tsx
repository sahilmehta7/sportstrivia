"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

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
}

export function ShowcaseFilterBar({ groups, className, condensed = false, onChange }: ShowcaseFilterBarProps) {
  return (
    <div
      className={cn(
        "w-full rounded-[2rem] border border-white/5 px-6 py-4 md:px-8 md:py-6",
        "glass-elevated shadow-glass",
        className
      )}
    >
      <div className="flex flex-col gap-6">
        {groups.map((group) => {
          const type = group.type ?? (condensed ? "select" : "pill");
          if (type === "select") {
            return (
              <div key={group.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/80">
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
                  <SelectTrigger className="w-full rounded-2xl glass-elevated border-white/10 h-11 md:w-64 font-bold uppercase tracking-widest text-[10px]">
                    <SelectValue placeholder={`Select ${group.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent className="glass-elevated border-white/10">
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="font-bold uppercase tracking-widest text-[10px]">
                        <div className="flex items-center gap-2">
                          {option.emoji && <span aria-hidden="true">{option.emoji}</span>}
                          <span>{option.label}</span>
                          {typeof option.count === "number" && (
                            <span className="text-[10px] opacity-40 ml-auto">({option.count})</span>
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
            <div key={group.id} className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/80">
                {group.label}
              </span>
              <div className={cn(
                "flex gap-2",
                group.id === "category" ? "overflow-x-auto pb-2 no-scrollbar" : "flex-wrap"
              )}>
                {group.options.map((option) => {
                  const active = option.value === group.activeValue || (group.activeValue === undefined && option.value === "all");
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={active ? "neon" : "glass"}
                      size="sm"
                      onClick={() => onChange?.(group.id, option)}
                      className={cn(
                        "rounded-full px-4 h-9 text-[10px] font-black uppercase tracking-widest whitespace-nowrap blur-0 transition-all duration-300",
                        active ? "shadow-neon-cyan/20" : "border-white/5 hover:border-white/10"
                      )}
                    >
                      {option.emoji && <span aria-hidden="true" className="mr-2 text-xs">{option.emoji}</span>}
                      {option.label}
                      {typeof option.count === "number" && (
                        <span className={cn(
                          "ml-2 text-[10px] font-bold p-[2px] rounded-md px-1",
                          active ? "bg-black/20" : "bg-white/5"
                        )}>{option.count}</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
