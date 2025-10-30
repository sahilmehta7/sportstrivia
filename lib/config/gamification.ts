export const GAMIFICATION_FEATURE_ENABLED =
  process.env.NEXT_PUBLIC_GAMIFICATION_ENABLED !== "false";

export const LEVELS_MAX = 100;
export const TIERS_MAX = 10;

// Quadratic curve coefficients: points = k * L^2 + c
// Tuned so Level 1 ~= 100 after rounding, progressively harder.
export const DEFAULT_QUADRATIC_K = 50; // growth factor per squared level
export const DEFAULT_QUADRATIC_C = 50; // base offset

export function roundPoints(value: number): number {
  const nearest = value < 10_000 ? 100 : 1000;
  return Math.round(value / nearest) * nearest;
}

export function pointsForLevel(
  level: number,
  k: number = DEFAULT_QUADRATIC_K,
  c: number = DEFAULT_QUADRATIC_C
): number {
  if (level < 1) return 0;
  const raw = k * level * level + c;
  return roundPoints(raw);
}

export const DEFAULT_TIER_NAMES: string[] = [
  "Rookie",
  "Amateur",
  "Varsity",
  "Provisional",
  "Semi-Pro",
  "Pro",
  "All-Star",
  "MVP",
  "Hall of Famer",
  "Legend",
];

export function slugifyTierName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}


