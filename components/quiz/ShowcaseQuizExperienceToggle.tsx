"use client";

import { useMemo, useState } from "react";
import { ShowcaseQuizExperience, type ShowcaseQuizExperienceQuestion, type ShowcaseQuizExperienceVariant } from "./ShowcaseQuizExperience";
import { cn } from "@/lib/utils";

interface ShowcaseQuizExperienceToggleProps {
  questions: ShowcaseQuizExperienceQuestion[];
  helperText?: string;
  alternateHelperText?: string;
  initialVariant?: ShowcaseQuizExperienceVariant;
  className?: string;
}

const variantOptions: Array<{ value: ShowcaseQuizExperienceVariant; label: string; icon: string }> = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
];

export function ShowcaseQuizExperienceToggle({
  questions,
  helperText = "Tap an answer to lock it in",
  alternateHelperText,
  initialVariant = "dark",
  className,
}: ShowcaseQuizExperienceToggleProps) {
  const [variant, setVariant] = useState<ShowcaseQuizExperienceVariant>(initialVariant);

  const activeHelperText = useMemo(() => {
    if (variant === "dark") {
      return alternateHelperText ?? helperText ?? "Tap an answer to lock it in";
    }
    return helperText ?? "Tap an answer to lock it in";
  }, [alternateHelperText, helperText, variant]);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-lg">
          {variantOptions.map((option) => {
            const isActive = option.value === variant;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setVariant(option.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition-all",
                  isActive
                    ? "bg-white text-slate-900 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.5)]"
                    : "text-white/70 hover:text-white"
                )}
                aria-pressed={isActive}
              >
                <span className="text-base" aria-hidden="true">
                  {option.icon}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <ShowcaseQuizExperience
        variant={variant}
        helperText={activeHelperText}
        questions={questions}
      />
    </div>
  );
}
