"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getChipStyles } from "@/lib/showcase-theme";
import { Play, Loader2 } from "lucide-react";

export interface ContinuePlayingItem {
  id: string;
  title: string;
  progress: number; // 0-1
  streak?: number;
  lastPlayedLabel?: string;
  daysOfWeek?: boolean[]; // 7-length, Sun..Sat (or locale-agnostic)
}

interface ContinuePlayingQueueProps {
  items: ContinuePlayingItem[];
  onResume?: (item: ContinuePlayingItem) => void | Promise<void>;
  className?: string;
  embedded?: boolean; // when true, don't render outer card surface
}

export function ShowcaseContinuePlayingQueue({ items, onResume, className, embedded = false }: ContinuePlayingQueueProps) {
  const { theme } = useShowcaseTheme();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!items.length) return null;

  return (
    <div className={cn(embedded ? "" : cn("space-y-3 rounded-[2rem] p-5", getSurfaceStyles(theme, "base")), className)}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h3 className={cn("text-sm font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
            Continue Playing
          </h3>
          <span className={cn("text-xs", getTextColor(theme, "muted"))}>{items.length} active</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn("flex items-center gap-4 rounded-2xl px-4 py-3", embedded ? "bg-transparent" : getSurfaceStyles(theme, "sunken"))}
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
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] uppercase tracking-[0.3em]", getTextColor(theme, "muted"))}>
                  {item.lastPlayedLabel ?? "Last played moments ago"}
                </span>
                {Array.isArray(item.daysOfWeek) && item.daysOfWeek.length === 7 && (
                  <div className="ml-3 flex items-center gap-1">
                    {item.daysOfWeek.map((d, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-1.5 w-4 rounded-full",
                          d ? "bg-emerald-400" : theme === "light" ? "bg-slate-200" : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="h-9 w-9 rounded-full p-0"
              disabled={loadingId === item.id}
              onClick={async () => {
                if (!onResume) return;
                try {
                  setLoadingId(item.id);
                  await Promise.resolve(onResume(item));
                } finally {
                  // In most cases navigation will occur before this runs
                  setLoadingId(null);
                }
              }}
            >
              {loadingId === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
