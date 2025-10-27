"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getTextColor } from "@/lib/showcase-theme";

interface ShowcaseSectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ShowcaseSectionHeader({ eyebrow, title, subtitle, actionLabel, onAction, className }: ShowcaseSectionHeaderProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        {eyebrow && (
          <span className={cn("text-xs font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "muted"))}>
            {eyebrow}
          </span>
        )}
        <h2 className={cn("text-3xl font-black", getTextColor(theme, "primary"))}>{title}</h2>
        {subtitle && <p className={cn("mt-1 text-sm", getTextColor(theme, "secondary"))}>{subtitle}</p>}
      </div>
      {actionLabel && (
        <Button onClick={onAction} className="rounded-full uppercase tracking-[0.3em]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
