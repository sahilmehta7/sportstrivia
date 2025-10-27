"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ShowcaseEmptyState({ icon = "🧭", title, description, actionLabel, onAction, className }: ShowcaseEmptyStateProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-[2rem] px-6 py-12 text-center", getSurfaceStyles(theme, "sunken"), className)}>
      <span className="text-5xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className={cn("text-lg font-semibold", getTextColor(theme, "primary"))}>{title}</h3>
      {description && <p className={cn("max-w-sm text-sm", getTextColor(theme, "secondary"))}>{description}</p>}
      {actionLabel && (
        <Button onClick={onAction} className="rounded-full">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
