"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";
import { generatePattern } from "@/lib/pattern-generator";
import { Clock, Users } from "lucide-react";

interface ShowcaseQuizCardProps {
  title: string;
  badgeLabel?: string;
  durationLabel: string;
  playersLabel: string;
  accent?: string;
  coverImageUrl?: string | null;
  className?: string;
}

export function ShowcaseQuizCard({
  title,
  badgeLabel,
  durationLabel,
  playersLabel,
  accent,
  coverImageUrl,
  className,
}: ShowcaseQuizCardProps) {
  const pattern = useMemo(() => generatePattern(title), [title]);

  const label = (badgeLabel ?? "Featured").toUpperCase();

  return (
    <div className={cn("w-[300px] h-full", className)}>
      <div className={cn(
        "flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/5",
        "glass-elevated transition-all duration-300 hover:scale-[1.02] hover:border-primary/20",
        "group"
      )}>
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {/* Background Layer */}
          {accent ? (
            <div
              className={cn(
                "absolute inset-0 opacity-60 mix-blend-overlay",
                !accent.startsWith('hsl') && !accent.startsWith('#') ? accent : ""
              )}
              style={{ backgroundColor: accent.startsWith('hsl') || accent.startsWith('#') ? accent : undefined }}
            />
          ) : (
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{ background: pattern.backgroundImage }}
            />
          )}

          {coverImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${coverImageUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/80" />

          <div className="absolute top-4 left-4">
            <span className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
              "glass border-white/10 text-white shadow-sm"
            )}>
              {label}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-6">
          <div className="text-left space-y-2">
            <h3 className={cn("line-clamp-2", glassText.h3)}>
              {title}
            </h3>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Clock className="h-3 w-3 text-primary" />
              <span>{durationLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Users className="h-3 w-3 text-secondary" />
              <span>{playersLabel}</span>
            </div>
          </div>
        </div>

        {/* Animated bottom bar */}
        <div className="h-1 w-0 bg-primary group-hover:w-full transition-all duration-500 shadow-neon-cyan" />
      </div>
    </div>
  );
}
