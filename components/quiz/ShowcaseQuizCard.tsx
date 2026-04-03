"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { generatePattern } from "@/lib/pattern-generator";
import { Clock, Users, Play, Zap } from "lucide-react";

interface ShowcaseQuizCardProps {
  id: string;
  title: string;
  badgeLabel?: string;
  metaPrimaryLabel?: string;
  metaPrimaryValue?: string;
  metaSecondaryLabel?: string;
  metaSecondaryValue?: string;
  metaTertiaryLabel?: string;
  metaTertiaryValue?: string;
  /**
   * @deprecated Use metaPrimaryValue.
   */
  durationLabel?: string;
  /**
   * @deprecated Use metaSecondaryValue.
   */
  playersLabel?: string;
  /**
   * @deprecated Use metaTertiaryValue.
   */
  difficultyLabel?: string;
  contextLabel?: string;
  accent?: string;
  coverImageUrl?: string | null;
  ctaLabel?: string;
  className?: string;
  href?: string;
  priority?: boolean;
}

export function ShowcaseQuizCard({
  id,
  title,
  metaPrimaryLabel,
  metaPrimaryValue,
  metaSecondaryLabel,
  metaSecondaryValue,
  metaTertiaryLabel,
  metaTertiaryValue,
  durationLabel,
  playersLabel,
  difficultyLabel,
  contextLabel,
  accent,
  coverImageUrl,
  ctaLabel = "PLAY NOW",
  className,
  href,
  priority = false,
}: ShowcaseQuizCardProps) {
  const pattern = useMemo(() => generatePattern(title), [title]);
  const linkHref = href || `/quizzes/${id}`;
  void ctaLabel;
  const stats = [
    {
      label: metaPrimaryLabel ?? "Duration",
      value: metaPrimaryValue ?? durationLabel ?? "",
      icon: Clock,
    },
    {
      label: metaSecondaryLabel ?? "Players",
      value: metaSecondaryValue ?? playersLabel ?? "",
      icon: Users,
    },
    {
      label: metaTertiaryLabel ?? "Difficulty",
      value: metaTertiaryValue ?? difficultyLabel,
      icon: Zap,
    },
  ].filter((entry) => Boolean(entry.value));

  return (
    <Link href={linkHref} className={cn("relative group block h-full transition-all duration-300", className)}>
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
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
            />
          )}

          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />

          {/* Play/Join Indicator */}
          <div className="absolute bottom-4 right-4 z-10 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="bg-accent p-3 text-white shadow-athletic">
              <Play className="h-5 w-5 fill-current" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-8">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 min-h-[2em] text-2xl font-bold uppercase tracking-tighter leading-none font-['Barlow_Condensed',sans-serif] group-hover:text-accent transition-colors">
                {title}
              </h3>
              {contextLabel ? (
                <span className="shrink-0 border border-foreground/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  {contextLabel}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap">
              {stats.map(({ label: statLabel, value, icon: StatIcon }) => (
                <div key={statLabel} className="flex items-center gap-1.5 min-w-0">
                  <StatIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="sr-only">{statLabel}</span>
                  <span className="truncate text-[9px] font-bold tracking-[0.12em] uppercase text-muted-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
