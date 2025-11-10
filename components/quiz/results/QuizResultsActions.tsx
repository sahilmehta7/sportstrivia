import type { ReactNode } from "react";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { cn } from "@/lib/utils";

interface QuizResultsActionsProps {
  theme?: ShowcaseTheme;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  extraActions?: ReactNode;
  className?: string;
}

export function QuizResultsActions({
  theme,
  primaryAction,
  secondaryAction,
  extraActions,
  className,
}: QuizResultsActionsProps) {
  if (!primaryAction && !secondaryAction && !extraActions) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4",
        theme === "light" ? "text-slate-700" : "text-white/80",
        className,
      )}
    >
      {primaryAction}
      {secondaryAction}
      {extraActions}
    </div>
  );
}


