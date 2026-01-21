"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getBackgroundVariant, getBlurCircles } from "@/lib/showcase-theme";
import type { BackgroundVariant } from "@/lib/showcase-theme";

interface ThemedSectionProps {
  variant: BackgroundVariant;
  children: ReactNode;
  showBlur?: boolean;
  className?: string;
  withContainer?: boolean;
}

export function ThemedSection({
  variant,
  children,
  showBlur = true,
  className,
  withContainer = false
}: ThemedSectionProps) {
  const blurCircles = getBlurCircles();

  return (
    <section className={cn(
      "relative overflow-hidden",
      getBackgroundVariant(variant),
      className
    )}>
      {showBlur && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
          <div className={cn(
            "absolute -left-[10%] top-[10%] h-[40%] w-[40%] rounded-full blur-[120px] opacity-40 animate-pulse-glow",
            blurCircles.circle1
          )} />
          <div className={cn(
            "absolute -right-[5%] top-[5%] h-[35%] w-[35%] rounded-full blur-[100px] opacity-30",
            blurCircles.circle2
          )} />
          <div className={cn(
            "absolute -bottom-[10%] left-[30%] h-[30%] w-[30%] rounded-full blur-[90px] opacity-20 animate-pulse-glow",
            blurCircles.circle3
          )} />
        </div>
      )}

      {withContainer ? (
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
