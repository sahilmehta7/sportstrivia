"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { trackEvent } from "@/lib/analytics";
import {
  OnboardingStepGraphic,
  type OnboardingGraphicVariant,
} from "@/components/features/onboarding/OnboardingStepGraphic";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

type PreOnboardingFlowProps = {
  onFinish: () => void;
  onSkip: () => void;
  onStepChange?: (step: number, stepName: string) => void;
};

type FlowStep = {
  name: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  graphicVariant: OnboardingGraphicVariant;
  graphicCaption?: string;
};

const steps: FlowStep[] = [
  {
    name: "value_intro",
    eyebrow: "Daily Trivia",
    title: "Fast sports quizzes. Every day.",
    body: "Answer quick questions across major sports.",
    cta: "Continue",
    graphicVariant: "quiz_start",
    graphicCaption: "Quick start in under 2 minutes",
  },
  {
    name: "progress_intro",
    eyebrow: "Live Progress",
    title: "Build streaks and climb rankings.",
    body: "Your score, speed, and consistency move you up.",
    cta: "Continue",
    graphicVariant: "leaderboard_progress",
    graphicCaption: "Track rank gains after every run",
  },
  {
    name: "start_quiz",
    eyebrow: "Start Now",
    title: "Pick a quiz and set your baseline.",
    body: "Get your first score in minutes.",
    cta: "Start Playing",
    graphicVariant: "first_quiz_launch",
    graphicCaption: "First run unlocks your rank journey",
  },
];

const SWIPE_THRESHOLD = 56;

export function PreOnboardingFlow({ onFinish, onSkip, onStepChange }: PreOnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const hasExitedFlow = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, []);

  useEffect(() => {
    const step = steps[stepIndex];
    onStepChange?.(stepIndex + 1, step.name);
  }, [onStepChange, stepIndex]);

  useEffect(() => {
    return () => {
      if (hasExitedFlow.current) {
        return;
      }
      const current = steps[stepIndex];
      trackEvent("pre_onboarding_abandon", {
        step: stepIndex + 1,
        step_name: current.name,
      });
    };
  }, [stepIndex]);

  const currentStep = steps[stepIndex];

  const handleContinue = () => {
    if (stepIndex === steps.length - 1) {
      hasExitedFlow.current = true;
      onFinish();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const goToPrevious = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const goToNext = () => {
    if (stepIndex === steps.length - 1) {
      onFinish();
      return;
    }
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  const beginGesture = (x: number, y: number) => {
    gestureStart.current = { x, y };
  };

  const endGesture = (x: number, y: number) => {
    const start = gestureStart.current;
    gestureStart.current = null;

    if (!start) {
      return;
    }

    const deltaX = x - start.x;
    const deltaY = y - start.y;
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD;

    if (!isHorizontalSwipe) {
      return;
    }

    if (deltaX < 0) {
      if (stepIndex >= steps.length - 1) {
        return;
      }
      const fromStep = stepIndex + 1;
      const toStep = stepIndex + 2;
      trackEvent("pre_onboarding_swipe_navigated", {
        direction: "left",
        from_step: fromStep,
        to_step: toStep,
        from_step_name: steps[stepIndex].name,
        to_step_name: steps[stepIndex + 1].name,
      });
      goToNext();
      return;
    }

    if (stepIndex <= 0) {
      return;
    }
    const fromStep = stepIndex + 1;
    const toStep = stepIndex;
    trackEvent("pre_onboarding_swipe_navigated", {
      direction: "right",
      from_step: fromStep,
      to_step: toStep,
      from_step_name: steps[stepIndex].name,
      to_step_name: steps[stepIndex - 1].name,
    });
    goToPrevious();
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    beginGesture(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }
    endGesture(touch.clientX, touch.clientY);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    beginGesture(event.clientX, event.clientY);
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    endGesture(event.clientX, event.clientY);
  };

  const handleSkip = () => {
    hasExitedFlow.current = true;
    onSkip();
  };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: "easeOut" as const };

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_45%)]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      <div className="relative flex min-h-dvh flex-col px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.875rem,env(safe-area-inset-top))] sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  index === stepIndex ? "w-8 bg-primary" : "w-2.5 bg-white/15"
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="min-h-11 px-1 text-[11px] font-bold uppercase tracking-[0.26em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>
        </div>

        <div className="mt-2 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="relative h-4 w-4 overflow-hidden rounded-full sm:h-5 sm:w-5">
              <Image
                src="/logo-dark.png"
                alt="Sports Trivia"
                fill
                sizes="20px"
                className="object-contain"
                priority
              />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/75 sm:text-[10px]">
              Sports Trivia
            </span>
          </div>
        </div>

        <div
          className="flex flex-1 py-2"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            gestureStart.current = null;
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            gestureStart.current = null;
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -18 }}
              transition={transition}
              className="flex h-full w-full flex-1 flex-col"
            >
              <div className="flex flex-1 flex-col justify-between gap-5">
                <div className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.32em] text-primary/85">
                    {currentStep.eyebrow}
                  </p>
                  <h1 className={cn(
                    "max-w-[12ch] font-['Barlow_Condensed',sans-serif] text-3xl font-bold uppercase leading-[0.92] tracking-tight text-white sm:text-4xl max-[375px]:text-[1.65rem]",
                    getGradientText("editorial")
                  )}>
                    {currentStep.title}
                  </h1>
                  <p className="max-w-sm text-xs leading-5 text-zinc-300 sm:text-sm sm:leading-6">
                    {currentStep.body}
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/60 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:rounded-[2rem] sm:p-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border border-white/10 bg-white/5 blur-2xl" />

                  <div className="relative flex min-h-[150px] flex-col justify-between gap-3 sm:min-h-[170px]">
                    <OnboardingStepGraphic variant={currentStep.graphicVariant} />
                    {currentStep.graphicCaption && (
                      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">
                        {currentStep.graphicCaption}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 pt-1 sm:pt-2">
                  {stepIndex === steps.length - 1 ? (
                    <ShowcaseButton
                      variant="primary"
                      size="lg"
                      pill={false}
                      icon={<ArrowRight className="h-4 w-4" />}
                      iconPosition="end"
                      className="min-h-12 w-full rounded-[1rem] text-sm sm:min-h-14 sm:rounded-[1.25rem]"
                      onClick={handleContinue}
                    >
                      {currentStep.cta}
                    </ShowcaseButton>
                  ) : (
                    <p className="min-h-10 w-full text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:min-h-11 sm:text-[11px] sm:tracking-[0.24em]">
                      Swipe left to continue
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
