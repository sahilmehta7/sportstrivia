"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseToastProps {
  title: string;
  description?: string;
  icon?: string;
  className?: string;
}

export function ShowcaseToast({ title, description, icon = "✨", className }: ShowcaseToastProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div className={cn("inline-flex items-start gap-3 rounded-[1.5rem] px-4 py-3", getSurfaceStyles(theme, "raised"), className)}>
      <span className="text-xl" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className={cn("text-sm font-semibold", getTextColor(theme, "primary"))}>{title}</p>
        {description && <p className={cn("text-xs", getTextColor(theme, "secondary"))}>{description}</p>}
      </div>
    </div>
  );
}
