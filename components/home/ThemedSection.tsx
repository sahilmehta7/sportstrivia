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
}

export function ThemedSection({ variant, children, showBlur = true, className }: ThemedSectionProps) {
  // Theme logic is now handled via CSS classes
  const blurCircles = getBlurCircles();

  return (
    <section className={cn("relative", getBackgroundVariant(variant), className)}>
      {showBlur && (
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className={cn("absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]", blurCircles.circle1)} />
          <div className={cn("absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]", blurCircles.circle2)} />
          <div className={cn("absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]", blurCircles.circle3)} />
        </div>
      )}
      {children}
    </section>
  );
}

