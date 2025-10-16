import { prisma } from "@/lib/db";
import { ExperienceTier, Prisma } from "@prisma/client";

export const EXPERIENCE_TIER_CONFIG = [
  { tier: ExperienceTier.ROOKIE, label: "Rookie", minPoints: 0 },
  { tier: ExperienceTier.STARTER, label: "Starter", minPoints: 2_000 },
  { tier: ExperienceTier.ALL_STAR, label: "All-Star", minPoints: 6_000 },
  { tier: ExperienceTier.LEGEND, label: "Legend", minPoints: 15_000 },
] as const;

export type TierProgress = {
  tier: ExperienceTier;
  tierLabel: string;
  totalPoints: number;
  leveledUp: boolean;
  nextTier: ExperienceTier | null;
  nextTierLabel: string | null;
  pointsToNext: number | null;
  progressPercent: number;
};

export function getTierForPoints(totalPoints: number): {
  tier: ExperienceTier;
  tierLabel: string;
  nextTier: ExperienceTier | null;
  nextTierLabel: string | null;
  progressPercent: number;
  pointsToNext: number | null;
} {
  const sortedTiers = [...EXPERIENCE_TIER_CONFIG].sort((a, b) => a.minPoints - b.minPoints);

  let current = sortedTiers[0];
  let next: (typeof sortedTiers)[number] | null = null;

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    const upcoming = sortedTiers[i + 1] ?? null;

    if (totalPoints >= tier.minPoints) {
      current = tier;
      next = upcoming;
    } else {
      break;
    }
  }

  const nextThreshold = next?.minPoints ?? current.minPoints;
  const previousThreshold = current.minPoints;
  const range = next ? nextThreshold - previousThreshold : Math.max(1, totalPoints - previousThreshold);
  const progressWithinTier = totalPoints - previousThreshold;
  const progressPercent = Math.min(100, Math.round((progressWithinTier / range) * 100));
  const pointsToNext = next ? Math.max(0, nextThreshold - totalPoints) : null;

  return {
    tier: current.tier,
    tierLabel: current.label,
    nextTier: next?.tier ?? null,
    nextTierLabel: next?.label ?? null,
    progressPercent,
    pointsToNext,
  };
}

export async function applyProgression(
  userId: string,
  pointsEarned: number,
  overrides: Prisma.UserUpdateInput = {},
  currentTotals?: { totalPoints: number; experienceTier: ExperienceTier }
): Promise<TierProgress> {
  const user =
    currentTotals ??
    (await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPoints: true,
        experienceTier: true,
      },
    }));

  const currentTotal = user?.totalPoints ?? 0;
  const newTotal = currentTotal + Math.max(0, pointsEarned);

  const tierInfo = getTierForPoints(newTotal);
  const leveledUp = tierInfo.tier !== (user?.experienceTier ?? ExperienceTier.ROOKIE);

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...overrides,
      totalPoints: newTotal,
      experienceTier: tierInfo.tier,
    },
  });

  return {
    tier: tierInfo.tier,
    tierLabel: tierInfo.tierLabel,
    totalPoints: newTotal,
    leveledUp,
    nextTier: tierInfo.nextTier,
    nextTierLabel: tierInfo.nextTierLabel,
    pointsToNext: tierInfo.pointsToNext,
    progressPercent: tierInfo.progressPercent,
  };
}
