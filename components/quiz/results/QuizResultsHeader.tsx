import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getTextColor } from "@/lib/showcase-theme";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";

interface QuizResultsHeaderProps {
  theme?: ShowcaseTheme;
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function QuizResultsHeader({
  theme,
  title,
  subtitle,
  leading,
  trailing,
  className,
}: QuizResultsHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-6 py-5 border-b",
        theme === "light" ? "border-slate-200/50" : undefined,
        theme === "dark" ? "border-white/10" : undefined,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {leading}
          <div>
            <h1 className={cn("text-lg font-semibold", getTextColor(theme, "primary"))}>{title}</h1>
            {subtitle ? (
              <p className={cn("text-sm", getTextColor(theme, "secondary"))}>{subtitle}</p>
            ) : null}
          </div>
        </div>
        {trailing}
      </div>
    </div>
  );
}


