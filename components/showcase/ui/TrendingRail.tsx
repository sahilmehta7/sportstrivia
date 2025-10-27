"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getChipStyles } from "@/lib/showcase-theme";

export interface TrendingRailItem {
  id: string;
  title: string;
  subtitle?: string;
  coverImageUrl?: string | null;
  streakLabel?: string;
  live?: boolean;
}

interface ShowcaseTrendingRailProps {
  items: TrendingRailItem[];
  className?: string;
}

export function ShowcaseTrendingRail({ items, className }: ShowcaseTrendingRailProps) {
  const { theme } = useShowcaseTheme();
  const labelColor = getTextColor(theme, "secondary");
  const titleColor = getTextColor(theme, "primary");

  if (!items.length) return null;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="flex gap-4">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#quiz-${item.id}`}
            className={cn(
              "group relative flex h-40 w-64 flex-shrink-0 flex-col overflow-hidden rounded-[1.75rem] p-4 transition-transform duration-200 hover:-translate-y-1",
              getSurfaceStyles(theme, "raised")
            )}
          >
            {item.coverImageUrl ? (
              <Image
                src={item.coverImageUrl}
                alt={item.title}
                fill
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="relative flex flex-1 flex-col justify-between">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/60">
                {item.live && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-1 text-[10px] font-semibold uppercase">Live</span>}
                {item.streakLabel && (
                  <span className={cn("rounded-full px-2 py-1", getChipStyles(theme, "ghost"))}>{item.streakLabel}</span>
                )}
              </div>
              <div className="space-y-1">
                <h3 className={cn("text-lg font-semibold leading-tight", titleColor)}>{item.title}</h3>
                {item.subtitle && <p className={cn("text-xs", labelColor)}>{item.subtitle}</p>}
              </div>
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Tap to play</span>
                <Play className="h-4 w-4" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
