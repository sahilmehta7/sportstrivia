import type { ReactNode } from "react";
import {
  getBlurCircles,
  getGlassBackground,
} from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

interface QuizResultsLayoutProps {
  className?: string;
  children: ReactNode;
}

export function QuizResultsLayout({ className, children }: QuizResultsLayoutProps) {
  const blur = getBlurCircles();

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:py-16",
        getGlassBackground(),
        className,
      )}
    >
      <div className={cn("pointer-events-none", "absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]", blur.circle1)} />
      <div className={cn("pointer-events-none", "absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]", blur.circle2)} />
      <div className={cn("pointer-events-none", "absolute left-1/2 bottom-8 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]", blur.circle3)} />
      <div className="relative w-full max-w-5xl">
        {children}
      </div>
    </div>
  );
}


