"use client";

import { cn } from "@/lib/utils";

export type OnboardingGraphicVariant =
  | "quiz_start"
  | "leaderboard_progress"
  | "first_quiz_launch";

type OnboardingStepGraphicProps = {
  variant: OnboardingGraphicVariant;
  className?: string;
};

function QuizStartGraphic() {
  return (
    <svg viewBox="0 0 320 150" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="quizCard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>
      </defs>
      <rect x="6" y="8" width="220" height="128" rx="18" fill="url(#quizCard)" stroke="rgba(255,255,255,0.18)" />
      <rect x="24" y="28" width="170" height="10" rx="5" fill="rgba(255,255,255,0.72)" />
      <rect x="24" y="48" width="145" height="8" rx="4" fill="rgba(255,255,255,0.32)" />
      <rect x="24" y="78" width="72" height="28" rx="14" fill="rgba(245,191,36,0.24)" stroke="rgba(245,191,36,0.55)" />
      <rect x="106" y="78" width="72" height="28" rx="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
      <circle cx="272" cy="48" r="30" fill="rgba(245,191,36,0.2)" stroke="rgba(245,191,36,0.6)" />
      <path d="M272 34v17l10 6" stroke="rgba(255,255,255,0.95)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function LeaderboardProgressGraphic() {
  return (
    <svg viewBox="0 0 320 150" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="bars" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(245,191,36,0.55)" />
        </linearGradient>
      </defs>
      <rect x="20" y="88" width="54" height="42" rx="10" fill="rgba(255,255,255,0.08)" />
      <rect x="84" y="72" width="54" height="58" rx="10" fill="rgba(255,255,255,0.12)" />
      <rect x="148" y="52" width="54" height="78" rx="10" fill="url(#bars)" />
      <rect x="212" y="32" width="54" height="98" rx="10" fill="url(#bars)" opacity="0.95" />
      <path d="M28 64l62-12 56 8 70-26 42-8" stroke="rgba(245,191,36,0.92)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="258" cy="26" r="8" fill="rgba(245,191,36,0.95)" />
    </svg>
  );
}

function FirstQuizLaunchGraphic() {
  return (
    <svg viewBox="0 0 320 150" className="h-full w-full" aria-hidden="true">
      <circle cx="160" cy="74" r="56" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" />
      <circle cx="160" cy="74" r="39" fill="rgba(245,191,36,0.14)" stroke="rgba(245,191,36,0.42)" />
      <circle cx="160" cy="74" r="23" fill="rgba(245,191,36,0.28)" />
      <path d="M150 58l26 16-26 16z" fill="rgba(255,255,255,0.96)" />
      <path d="M224 28l22-5-7 21" fill="none" stroke="rgba(245,191,36,0.95)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M228 40l-20 18" fill="none" stroke="rgba(245,191,36,0.95)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function OnboardingStepGraphic({ variant, className }: OnboardingStepGraphicProps) {
  return (
    <div
      className={cn(
        "relative h-28 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:h-32",
        className
      )}
    >
      {variant === "quiz_start" && <QuizStartGraphic />}
      {variant === "leaderboard_progress" && <LeaderboardProgressGraphic />}
      {variant === "first_quiz_launch" && <FirstQuizLaunchGraphic />}
    </div>
  );
}
