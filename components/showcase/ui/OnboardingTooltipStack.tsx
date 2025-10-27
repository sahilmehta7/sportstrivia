"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface ShowcaseOnboardingTooltipStackProps {
  steps: OnboardingStep[];
  className?: string;
}

export function ShowcaseOnboardingTooltipStack({ steps, className }: ShowcaseOnboardingTooltipStackProps) {
  const { theme } = useShowcaseTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!steps.length) return null;

  const activeStep = steps[activeIndex];

  return (
    <div className={cn("relative rounded-[2rem] p-6", getSurfaceStyles(theme, "raised"), className)}>
      <div className="flex gap-3">
        <div className="flex flex-col gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]",
                index === activeIndex
                  ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                  : getSurfaceStyles(theme, "sunken")
              )}
            >
              <span>{step.icon ?? "⭐"}</span>
              {step.title}
            </button>
          ))}
        </div>
        <div className="flex-1 rounded-[1.5rem] bg-white/5 p-6">
          <h4 className={cn("text-lg font-bold", getTextColor(theme, "primary"))}>{activeStep.title}</h4>
          <p className={cn("mt-2 text-sm", getTextColor(theme, "secondary"))}>{activeStep.description}</p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
              disabled={activeIndex === 0}
            >
              Back
            </Button>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => setActiveIndex((prev) => Math.min(prev + 1, steps.length - 1))}
              disabled={activeIndex === steps.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
