"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { generatePattern } from "@/lib/pattern-generator";
import { Clock, Users, Play, ShieldAlert } from "lucide-react";

interface ShowcaseQuizCardProps {
  id: string;
  title: string;
  badgeLabel?: string;
  durationLabel: string;
  playersLabel: string;
  accent?: string;
  coverImageUrl?: string | null;
  className?: string;
  href?: string;
}

export function ShowcaseQuizCard({
  id,
  title,
  badgeLabel,
  durationLabel,
  playersLabel,
  accent,
  coverImageUrl,
  className,
  href,
}: ShowcaseQuizCardProps) {
  const pattern = useMemo(() => generatePattern(title), [title]);
  const label = (badgeLabel ?? "Arena").toUpperCase();
  const linkHref = href || `/quizzes/${id}`;

  return (
    <Link href={linkHref} className={cn("relative group block transition-all duration-300", className)}>
      <div className={cn(
        "relative h-full flex flex-col overflow-hidden border-2 border-foreground/5 bg-background",
        "transition-all duration-300 group-hover:border-foreground group-hover:shadow-athletic",
      )}>
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b-2 border-foreground/5">
          {/* Background Layer */}
          {accent ? (
            <div
              className={cn(
                "absolute inset-0 opacity-10 mix-blend-multiply transition-opacity group-hover:opacity-20",
                !accent.startsWith('hsl') && !accent.startsWith('#') ? accent : ""
              )}
              style={{ backgroundColor: accent.startsWith('hsl') || accent.startsWith('#') ? accent : undefined }}
            />
          ) : (
            <div
              className="absolute inset-0 opacity-10 mix-blend-multiply transition-opacity group-hover:opacity-20"
              style={{ background: pattern.backgroundImage }}
            />
          )}

          {coverImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
              style={{ backgroundImage: `url(${coverImageUrl})` }}
            />
          )}

          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />

          {/* Badge */}
          <div className="absolute top-0 left-0 z-10">
            <div className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.2em]">
              <ShieldAlert className="h-3 w-3 text-accent" />
              {label}
            </div>
          </div>

          {/* Play/Join Indicator */}
          <div className="absolute bottom-4 right-4 z-10 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="bg-accent p-3 text-white shadow-athletic">
              <Play className="h-5 w-5 fill-current" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold uppercase tracking-tighter leading-none font-['Barlow_Condensed',sans-serif] group-hover:text-accent transition-colors line-clamp-2">
              {title}
            </h3>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{durationLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{playersLabel}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-foreground/5 pt-6">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-1 w-4 bg-foreground/10 group-hover:first:bg-accent group-hover:[&:nth-child(2)]:bg-accent group-hover:[&:nth-child(3)]:bg-accent transition-colors" />
              ))}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-foreground transition-colors">
              Enter Arena
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
