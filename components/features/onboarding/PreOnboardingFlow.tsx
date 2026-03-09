"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, LineChart, Target, Trophy } from "lucide-react";

import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

type PreOnboardingFlowProps = {
  onFinish: () => void;
  onSkip: () => void;
  onStepChange?: (step: number) => void;
};

type FlowStep = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  icon: typeof Trophy;
  accentClass: string;
  statLabel: string;
  statValue: string;
};

const steps: FlowStep[] = [
  {
    eyebrow: "Built for Matchday Focus",
    title: "Test your sports knowledge with purpose and momentum.",
    body: "Step into a quiz arena designed to keep every challenge sharp, fast, and worth finishing.",
    cta: "Continue",
    icon: Trophy,
    accentClass: "from-primary/30 via-primary/10 to-transparent",
    statLabel: "Daily Challenge",
    statValue: "Ready",
  },
  {
    eyebrow: "Find Your Rhythm",
    title: "Discover daily challenges, themed quizzes, and competitive progression.",
    body: "Move between fresh quizzes, skill-building runs, and leaderboard pushes without losing your place.",
    cta: "Continue",
    icon: LineChart,
    accentClass: "from-accent/30 via-accent/10 to-transparent",
    statLabel: "Leaderboards",
    statValue: "Live",
  },
  {
    eyebrow: "Start Strong",
    title: "Start your first challenge now.",
    body: "Pick your lane, play your first quiz, and let the app carry your streak from there.",
    cta: "Start Playing",
    icon: Target,
    accentClass: "from-primary/30 via-accent/10 to-transparent",
    statLabel: "First Arena",
    statValue: "Open",
  },
];

export function PreOnboardingFlow({ onFinish, onSkip, onStepChange }: PreOnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    onStepChange?.(stepIndex + 1);
  }, [onStepChange, stepIndex]);

  const currentStep = steps[stepIndex];
  const Icon = currentStep.icon;

  const handleContinue = () => {
    if (stepIndex === steps.length - 1) {
      onFinish();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: "easeOut" as const };

  return (
    <div className="fixed inset-0 z-[120] bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_45%)]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      <div className="relative flex min-h-dvh flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
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
            onClick={onSkip}
            className="min-h-11 px-1 text-[11px] font-bold uppercase tracking-[0.26em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>
        </div>

        <div className="flex flex-1 items-center py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -18 }}
              transition={transition}
              className="flex w-full flex-1 flex-col"
            >
              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.32em] text-primary/85">
                    {currentStep.eyebrow}
                  </p>
                  <h1 className={cn(
                    "max-w-[12ch] font-['Barlow_Condensed',sans-serif] text-5xl font-bold uppercase leading-[0.88] tracking-tight text-white",
                    getGradientText("editorial")
                  )}>
                    {currentStep.title}
                  </h1>
                  <p className="max-w-sm text-base leading-7 text-zinc-300">
                    {currentStep.body}
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/60 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                  <div className={cn("absolute inset-0 bg-gradient-to-br", currentStep.accentClass)} />
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border border-white/10 bg-white/5 blur-2xl" />

                  <div className="relative flex min-h-[260px] flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex items-center gap-3 border-l-4 border-accent bg-white/5 px-3 py-2">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                            {currentStep.statLabel}
                          </p>
                          <p className="font-['Barlow_Condensed',sans-serif] text-3xl font-bold uppercase tracking-tight text-white">
                            {currentStep.statValue}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/75">
                        Step {stepIndex + 1} / {steps.length}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {["Quiz", "Arena", "Leaderboard"].map((label, index) => (
                        <div
                          key={label}
                          className={cn(
                            "rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4",
                            index === stepIndex ? "border-primary/40 bg-primary/10" : "opacity-80"
                          )}
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                            {label}
                          </p>
                          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className={cn(
                                "h-full rounded-full bg-gradient-to-r",
                                index <= stepIndex ? "from-primary to-accent" : "from-white/0 to-white/0"
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-8">
                <ShowcaseButton
                  variant="primary"
                  size="lg"
                  pill={false}
                  icon={<ArrowRight className="h-4 w-4" />}
                  iconPosition="end"
                  className="min-h-14 w-full rounded-[1.25rem] text-sm"
                  onClick={handleContinue}
                >
                  {currentStep.cta}
                </ShowcaseButton>

                {stepIndex < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="min-h-11 w-full text-center text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Next screen
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
