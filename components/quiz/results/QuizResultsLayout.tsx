import type { ReactNode } from "react";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import {
  getBlurCircles,
  getGlassBackground,
  getShadowColor,
} from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

interface QuizResultsLayoutProps {
  theme?: ShowcaseTheme;
  className?: string;
  children: ReactNode;
}

export function QuizResultsLayout({ theme, className, children }: QuizResultsLayoutProps) {
  const blur = getBlurCircles(theme);

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-4 py-12 sm:px-6 lg:py-16",
        getGlassBackground(theme),
        className,
      )}
    >
      <div className={cn("pointer-events-none", "absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]", blur.circle1)} />
      <div className={cn("pointer-events-none", "absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]", blur.circle2)} />
      <div className={cn("pointer-events-none", "absolute left-1/2 bottom-8 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]", blur.circle3)} />
      <div
        className={cn(
          "relative w-full max-w-5xl rounded-[1.75rem] border p-6 sm:p-8 lg:p-10",
          getShadowColor(theme),
          theme === "light"
            ? "border-slate-200/60 bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-50/80"
            : "border-white/10 bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80",
        )}
      >
        {children}
      </div>
    </div>
  );
}


