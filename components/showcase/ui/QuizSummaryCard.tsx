"use client";

import Image from "next/image";
import { Clock, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
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
  const { theme } = useShowcaseTheme();

  const body = (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-[2rem] p-4 transition-transform duration-500 hover:-translate-y-1",
        getSurfaceStyles(theme, "sunken"),
        getCardGlow(theme)
      )}
    >
      <div className="relative mb-4 overflow-hidden rounded-[1.5rem]">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            width={640}
            height={360}
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-3xl text-white/60">
            🎯
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          {category && (
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]", getChipStyles(theme, "solid"))}>
              {category}
            </span>
          )}
          {isNew && (
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]", getChipStyles(theme, "outline"))}>
              New
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 text-left">
        <div>
          <h3 className={cn("text-xl font-bold leading-tight", getTextColor(theme, "primary"))}>{title}</h3>
          {subtitle && (
            <p className={cn("mt-1 text-sm", getTextColor(theme, "secondary"))}>{subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
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
              <span key={tag} className={cn("rounded-full px-3 py-1 uppercase tracking-[0.3em]", getChipStyles(theme, "ghost"))}>
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
      <a href={href} className={cn("block", className)}>
        {body}
      </a>
    );
  }

  return <div className={className}>{body}</div>;
}

interface MetaPillProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function MetaPill({ icon: Icon, label, value }: MetaPillProps) {
  const { theme } = useShowcaseTheme();
  const base = theme === "light" ? "bg-slate-900/5" : "bg-white/10";
  const textPrimary = theme === "light" ? "text-slate-700" : "text-white/80";
  const textSecondary = theme === "light" ? "text-slate-500" : "text-white/60";

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
