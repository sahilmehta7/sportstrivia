import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { QuizResultsTheme } from "./types";

interface QuizResultsHeaderProps {
  theme?: QuizResultsTheme;
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function QuizResultsHeader({
  theme: _theme,
  title,
  subtitle,
  leading,
  trailing,
  className,
}: QuizResultsHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 py-10",
        className,
      )}
    >
      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {leading}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-emerald-500"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                Mission Report
              </span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground sm:text-6xl lg:text-7xl">{title}</h1>
            {subtitle ? (
              <p className="max-w-2xl text-lg font-medium text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {trailing}
      </div>
      <div className="h-px w-full bg-gradient-to-r from-emerald-500/50 via-zinc-800 to-transparent" />
    </div>
  );
}
