"use client";

import { useEffect, useMemo, useState } from "react";
import { AttemptResetPeriod } from "@prisma/client";
import { Hourglass, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ATTEMPT_RESET_PERIOD_HELP_TEXT,
  ATTEMPT_RESET_PERIOD_LABELS,
} from "@/constants/attempts";

function formatSummary(
  maxAttempts: number,
  period: AttemptResetPeriod
): string {
  const plural = maxAttempts === 1 ? "" : "s";
  if (period === AttemptResetPeriod.NEVER) {
    return `${maxAttempts} attempt${plural} total`;
  }
  const label = ATTEMPT_RESET_PERIOD_LABELS[period]?.toLowerCase() ?? period.toLowerCase();
  return `${maxAttempts} attempt${plural} per ${label}`;
}

function formatCountdown(seconds: number | null): string | null {
  if (seconds === null) {
    return null;
  }
  if (seconds <= 0) {
    return "soon";
  }

  const units: Array<[number, string]> = [
    [60 * 60 * 24, "d"],
    [60 * 60, "h"],
    [60, "m"],
  ];

  let remaining = seconds;
  const parts: string[] = [];

  for (const [unitSeconds, suffix] of units) {
    if (remaining >= unitSeconds) {
      const value = Math.floor(remaining / unitSeconds);
      parts.push(`${value}${suffix}`);
      remaining -= value * unitSeconds;
    }
    if (parts.length === 2) {
      break;
    }
  }

  if (parts.length === 0) {
    parts.push(`${Math.max(remaining, 0)}s`);
  }

  return parts.join(" ");
}

export interface AttemptLimitBannerProps {
  maxAttempts: number;
  period: AttemptResetPeriod;
  attemptsRemaining?: number | null;
  attemptsUsed?: number | null;
  resetAt?: string | Date | null;
  requiresLogin?: boolean;
  className?: string;
  heading?: string;
  showProgress?: boolean;
}

export function AttemptLimitBanner({
  maxAttempts,
  period,
  attemptsRemaining = null,
  attemptsUsed = null,
  resetAt = null,
  requiresLogin = false,
  className,
  heading = "Attempt limit",
  showProgress = true,
}: AttemptLimitBannerProps) {
  const [secondsUntilReset, setSecondsUntilReset] = useState<number | null>(() => {
    if (!resetAt) return null;
    const target = new Date(resetAt).getTime();
    return Math.max(Math.round((target - Date.now()) / 1000), 0);
  });

  useEffect(() => {
    if (!resetAt) {
      setSecondsUntilReset(null);
      return;
    }

    const target = new Date(resetAt).getTime();
    const update = () => {
      const diff = Math.max(Math.round((target - Date.now()) / 1000), 0);
      setSecondsUntilReset(diff);
    };

    update();
    const interval = setInterval(update, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [resetAt]);

  const resolvedAttemptsRemaining =
    typeof attemptsRemaining === "number" ? Math.max(attemptsRemaining, 0) : null;

  const resolvedAttemptsUsed = useMemo(() => {
    if (typeof attemptsUsed === "number") {
      return Math.min(Math.max(attemptsUsed, 0), maxAttempts);
    }
    if (resolvedAttemptsRemaining !== null) {
      return Math.min(maxAttempts - resolvedAttemptsRemaining, maxAttempts);
    }
    return null;
  }, [attemptsUsed, resolvedAttemptsRemaining, maxAttempts]);

  const isLocked =
    resolvedAttemptsRemaining !== null ? resolvedAttemptsRemaining <= 0 : false;
  const summary = formatSummary(maxAttempts, period);
  const periodHelp = ATTEMPT_RESET_PERIOD_HELP_TEXT[period];
  const countdownLabel = formatCountdown(secondsUntilReset);

  const icon = isLocked ? <Lock className="h-5 w-5" /> : <Hourglass className="h-5 w-5" />;

  const progressSegments =
    showProgress && maxAttempts > 0 && maxAttempts <= 8 && resolvedAttemptsUsed !== null
      ? Array.from({ length: maxAttempts })
      : null;

  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 shadow-sm transition",
        isLocked
          ? "border-red-500/40 bg-red-500/10"
          : "border-primary/20 bg-primary/5",
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              isLocked ? "bg-red-500/20 text-red-600" : "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {heading}
            </p>
            <p className="text-base font-semibold text-foreground">{summary}</p>
            {requiresLogin ? (
              <p className="text-sm text-muted-foreground">
                Sign in to track your attempts and see remaining chances.
              </p>
            ) : resolvedAttemptsRemaining !== null ? (
              <p className="text-sm text-muted-foreground">
                {isLocked
                  ? "You’ve used all available attempts."
                  : `Attempts remaining: ${resolvedAttemptsRemaining} / ${maxAttempts}`}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{periodHelp}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          {progressSegments && (
            <div className="flex gap-1">
              {progressSegments.map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-2 w-6 rounded-full",
                    index < (resolvedAttemptsUsed ?? 0)
                      ? isLocked
                        ? "bg-red-500"
                        : "bg-primary"
                      : "bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>
          )}

          {period !== AttemptResetPeriod.NEVER && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-1 font-medium uppercase tracking-widest">
                Resets {ATTEMPT_RESET_PERIOD_LABELS[period]?.toLowerCase()}
              </span>
              {!requiresLogin && countdownLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-1 font-semibold text-foreground shadow-sm">
                  <Hourglass className="h-3 w-3 text-primary" />
                  {countdownLabel === "soon" ? "Resetting soon" : `in ${countdownLabel}`}
                </span>
              )}
              {!requiresLogin && !countdownLabel && resetAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-1 font-semibold text-foreground shadow-sm">
                  <Hourglass className="h-3 w-3 text-primary" />
                  Resets at {new Date(resetAt).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
