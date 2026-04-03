import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { QuizResultsTheme } from "./types";

interface QuizResultsCardProps {
  theme?: QuizResultsTheme;
  className?: string;
  children: ReactNode;
}

export function QuizResultsCard({ theme: _theme, className, children }: QuizResultsCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border/60 bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
