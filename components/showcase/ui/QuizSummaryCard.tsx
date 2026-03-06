"use client";

import Image from "next/image";
import { Clock, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSurfaceStyles, getTextColor, getChipStyles, getCardGlow } from "@/lib/showcase-theme";
import type { ComponentType } from "react";

export interface ShowcaseQuizSummaryMeta {
  durationLabel: string;
  playersLabel: string;
  difficulty?: string;
  rating?: number | null;
}

export interface ShowcaseQuizSummaryCardProps {
  title: string;
  subtitle?: string | null;
  href?: string;
  coverImageUrl?: string | null;
  category?: string;
  tags?: string[];
  meta: ShowcaseQuizSummaryMeta;
  isNew?: boolean;
  className?: string;
}

export function ShowcaseQuizSummaryCard({
  title,
  subtitle,
  href,
  coverImageUrl,
  category,
  tags = [],
  meta,
  isNew = false,
  className,
}: ShowcaseQuizSummaryCardProps) {
  const body = (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-[2rem] p-4 transition-transform duration-500 hover:-translate-y-1",
        getSurfaceStyles("sunken"),
        getCardGlow()
      )}
    >
      <div className="relative mb-4 overflow-hidden rounded-[1.5rem]">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            width={640}
            height={360}
            className="h-44 w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-muted to-card text-3xl text-muted-foreground/70">
            🎯
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/25 to-transparent" />
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          {category && (
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]", getChipStyles("solid"))}>
              {category}
            </span>
          )}
          {isNew && (
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]", getChipStyles("outline"))}>
              New
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 text-left">
        <div>
          <h3 className={cn("text-xl font-bold leading-tight", getTextColor("primary"))}>{title}</h3>
          {subtitle && (
            <p className={cn("mt-1 text-sm", getTextColor("secondary"))}>{subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
          <MetaPill icon={Clock} label="Duration" value={meta.durationLabel} />
          <MetaPill icon={Users} label="Players" value={meta.playersLabel} />
          {meta.difficulty && <MetaPill icon={SparkPeg} label="Difficulty" value={meta.difficulty} />}
          {typeof meta.rating === "number" && (
            <MetaPill icon={Star} label="Rating" value={`${meta.rating.toFixed(1)} / 5`} />
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[10px]">
            {tags.map((tag) => (
              <span key={tag} className={cn("rounded-full px-3 py-1 uppercase tracking-[0.3em]", getChipStyles("ghost"))}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className={cn("block group", className)}>
        {body}
      </a>
    );
  }

  return <div className={cn("block", className)}>{body}</div>;
}

interface MetaPillProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function MetaPill({ icon: Icon, label, value }: MetaPillProps) {
  const base = "bg-muted/60";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";

  return (
    <div className={cn("flex items-center gap-2 rounded-full px-3 py-2", base)}>
      <Icon className={cn("h-4 w-4", textPrimary)} />
      <div className="flex flex-col">
        <span className={cn("text-[10px] uppercase tracking-[0.3em]", textSecondary)}>{label}</span>
        <span className={cn("text-xs font-semibold", textPrimary)}>{value}</span>
      </div>
    </div>
  );
}

function SparkPeg(props: { className?: string }) {
  return <span className={cn("text-base", props.className)} aria-hidden="true">🎯</span>;
}
