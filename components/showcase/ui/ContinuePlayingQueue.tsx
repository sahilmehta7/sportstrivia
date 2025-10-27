"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getChipStyles } from "@/lib/showcase-theme";

export interface ContinuePlayingItem {
  id: string;
  title: string;
  progress: number; // 0-1
  streak?: number;
  lastPlayedLabel?: string;
}

interface ContinuePlayingQueueProps {
  items: ContinuePlayingItem[];
  onResume?: (item: ContinuePlayingItem) => void;
  className?: string;
}

export function ShowcaseContinuePlayingQueue({ items, onResume, className }: ContinuePlayingQueueProps) {
  const { theme } = useShowcaseTheme();

  if (!items.length) return null;

  return (
    <div className={cn("space-y-3 rounded-[2rem] p-5", getSurfaceStyles(theme, "base"), className)}>
      <div className="flex items-center justify-between">
        <h3 className={cn("text-sm font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
          Continue Playing
        </h3>
        <span className={cn("text-xs", getTextColor(theme, "muted"))}>{items.length} active</span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn("flex items-center gap-4 rounded-2xl px-4 py-3", getSurfaceStyles(theme, "sunken"))}
          >
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className={cn("text-sm font-semibold", getTextColor(theme, "primary"))}>{item.title}</p>
                {typeof item.streak === "number" && item.streak > 0 && (
                  <span className={cn("text-[10px] uppercase tracking-[0.3em]", getChipStyles(theme, "ghost"))}>
                    🔥 {item.streak}-day
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500"
                  style={{ width: `${Math.min(Math.max(item.progress, 0), 1) * 100}%` }}
                />
              </div>
              <span className={cn("text-[10px] uppercase tracking-[0.3em]", getTextColor(theme, "muted"))}>
                {item.lastPlayedLabel ?? "Last played moments ago"}
              </span>
            </div>
            <Button
              variant="outline"
              className="rounded-full text-xs font-semibold uppercase tracking-[0.3em]"
              onClick={() => onResume?.(item)}
            >
              Resume
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
