"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";
import { generatePattern } from "@/lib/pattern-generator";
import { Clock, Users, Zap, PlayCircle, Star } from "lucide-react";

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
  const label = (badgeLabel ?? "Arena").toUpperCase();

  return (
    <div className={cn("relative group transition-all duration-500", className)}>
      {/* Glow backdrop */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />

      <div className={cn(
        "relative h-full flex flex-col overflow-hidden rounded-[2.5rem] border border-white/5",
        "glass-elevated transition-all duration-500 group-hover:border-primary/30 group-hover:bg-white/5",
        "shadow-glass group-hover:shadow-neon-cyan/20"
      )}>
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {/* Background Layer */}
          {accent ? (
            <div
              className={cn(
                "absolute inset-0 opacity-40 mix-blend-overlay transition-opacity group-hover:opacity-60",
                !accent.startsWith('hsl') && !accent.startsWith('#') ? accent : ""
              )}
              style={{ backgroundColor: accent.startsWith('hsl') || accent.startsWith('#') ? accent : undefined }}
            />
          ) : (
            <div
              className="absolute inset-0 opacity-20 mix-blend-overlay transition-opacity group-hover:opacity-40"
              style={{ background: pattern.backgroundImage }}
            />
          )}

          {coverImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${coverImageUrl})` }}
            />
          )}

          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse shadow-neon-cyan" />
              {label}
            </div>
          </div>

          {/* Quick Action Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
            <div className="h-16 w-16 rounded-full glass border border-white/20 flex items-center justify-center text-primary shadow-neon-cyan/40 backdrop-blur-md">
              <PlayCircle className="h-8 w-8 fill-primary/10" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
          <div className="space-y-3">
            <h3 className="text-xl font-black uppercase tracking-tighter leading-[1.1] group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl glass border border-white/5 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100 transition-all" />
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">{durationLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl glass border border-white/5 flex items-center justify-center">
                <Users className="h-4 w-4 text-secondary opacity-60 group-hover:opacity-100 transition-all" />
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">{playersLabel}</span>
            </div>
          </div>
        </div>

        {/* Bottom Accent Bar */}
        <div className="h-1.5 w-full bg-white/5 overflow-hidden">
          <div className="h-full w-0 bg-gradient-to-r from-primary to-secondary transition-all duration-700 group-hover:w-full ease-out shadow-neon-cyan" />
        </div>
      </div>
    </div>
  );
}
