export const AttemptResetPeriod = {
  NEVER: "NEVER",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
} as const;

export const ATTEMPT_RESET_PERIODS = [
  AttemptResetPeriod.NEVER,
  AttemptResetPeriod.DAILY,
  AttemptResetPeriod.WEEKLY,
  AttemptResetPeriod.MONTHLY,
] as const;

export type AttemptResetPeriodValue = (typeof ATTEMPT_RESET_PERIODS)[number];

export const ATTEMPT_RESET_PERIOD_LABELS: Record<AttemptResetPeriodValue, string> = {
  NEVER: "Never",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export const ATTEMPT_RESET_PERIOD_HELP_TEXT: Record<AttemptResetPeriodValue, string> = {
  NEVER: "Attempts do not automatically reset.",
  DAILY: "Resets every day at 00:00 UTC.",
  WEEKLY: "Resets every Sunday at 00:00 UTC.",
  MONTHLY: "Resets on the first day of each month at 00:00 UTC.",
};

export const ATTEMPT_RESET_PERIOD_OPTIONS = ATTEMPT_RESET_PERIODS.map((value) => ({
  value,
  label: ATTEMPT_RESET_PERIOD_LABELS[value],
  description: ATTEMPT_RESET_PERIOD_HELP_TEXT[value],
}));

export function isAttemptResetPeriod(value: unknown): value is AttemptResetPeriodValue {
  return typeof value === "string" && (ATTEMPT_RESET_PERIODS as readonly string[]).includes(value);
}
