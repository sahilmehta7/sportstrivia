import { prisma } from "../db";
import {
  LEVELS_MAX,
  TIERS_MAX,
  DEFAULT_TIER_NAMES,
  pointsForLevel,
  slugifyTierName,
} from "../config/gamification";
import { notifyLevelUp, notifyTierUpgrade } from "./notification.service";

export type ComputedLevel = {
  level: number;
  nextLevelPoints: number | null;
  progressPct: number; // 0-100 relative to current level span
};

export async function ensureSeededDefaults(): Promise<void> {
  const [levelCount, tierCount] = await Promise.all([
    prisma.level.count(),
    prisma.tier.count(),
  ]);
  if (levelCount === 0) {
    const levelData = Array.from({ length: LEVELS_MAX }, (_, i) => {
      const level = i + 1;
      return {
        level,
        pointsRequired: pointsForLevel(level),
        isActive: true,
      };
    });
    await prisma.level.createMany({ data: levelData });
  }
  if (tierCount === 0) {
    const names = (DEFAULT_TIER_NAMES || []).slice(0, TIERS_MAX);
    const levelsPerTier = Math.floor(LEVELS_MAX / TIERS_MAX);
    const tierData = names.map((name, idx) => {
      const startLevel = idx * levelsPerTier + 1;
      const endLevel = idx === TIERS_MAX - 1 ? LEVELS_MAX : (idx + 1) * levelsPerTier;
      return {
        name,
        slug: slugifyTierName(name),
        description: `${name} tier (Levels ${startLevel}-${endLevel})`,
        startLevel,
        endLevel,
        order: idx + 1,
      };
    });
    await prisma.tier.createMany({ data: tierData });
  }
}

export async function listLevels() {
  return prisma.level.findMany({ orderBy: { level: "asc" } });
}

export async function getLevel(levelNumber: number) {
  return prisma.level.findUnique({ where: { level: levelNumber } });
}

export async function upsertLevel(levelNumber: number, pointsRequired: number, isActive: boolean = true) {
  return prisma.level.upsert({
    where: { level: levelNumber },
    update: { pointsRequired, isActive },
    create: { level: levelNumber, pointsRequired, isActive },
  });
}

export async function deleteLevel(levelNumber: number) {
  if (levelNumber === 1) throw new Error("Cannot delete level 1");
  await prisma.level.delete({ where: { level: levelNumber } });
}

export async function listTiers() {
  return prisma.tier.findMany({ orderBy: { order: "asc" } });
}

export async function getTierForLevel(level: number) {
  return prisma.tier.findFirst({
    where: { startLevel: { lte: level }, endLevel: { gte: level } },
    orderBy: { order: "asc" },
  });
}

export async function upsertTier(input: {
  id?: number;
  name: string;
  slug?: string;
  description?: string | null;
  startLevel: number;
  endLevel: number;
  color?: string | null;
  icon?: string | null;
  order: number;
}) {
  const { id, name, slug, description, startLevel, endLevel, color, icon, order } = input;
  if (startLevel < 1 || endLevel < startLevel) {
    throw new Error("Invalid tier level range");
  }
  const data = {
    name,
    slug: slug ?? slugifyTierName(name),
    description: description ?? null,
    startLevel,
    endLevel,
    color: color ?? null,
    icon: icon ?? null,
    order,
  };
  if (id) {
    return prisma.tier.update({ where: { id }, data });
  } else {
    return prisma.tier.create({ data });
  }
}

export async function deleteTier(id: number) {
  await prisma.tier.delete({ where: { id } });
}

export async function computeLevelFromPoints(totalPoints: number): Promise<ComputedLevel> {
  let levels: Array<{ level: number; pointsRequired: number; isActive: boolean }> = [];
  try {
    // If Prisma is not generated or model not migrated, this may throw; fallback to curve
    // @ts-ignore runtime safety
    if ((prisma as any)?.level?.findMany) {
      levels = await prisma.level.findMany({ orderBy: { level: "asc" } });
    }
  } catch {
    // Silently fail - level model may not be available, will use fallback curve
  }

  if (!levels || levels.length === 0) {
    // Fallback to on-the-fly curve if DB empty
    // All users start at minimum level 1
    let level = 1;
    for (let i = 1; i <= LEVELS_MAX; i++) {
      if (pointsForLevel(i) <= totalPoints) level = i;
    }
    const nextLevel = Math.min(level + 1, LEVELS_MAX);
    const currentReq = pointsForLevel(level);
    const nextReq = nextLevel > level ? pointsForLevel(nextLevel) : null;
    const span = nextReq ? Math.max(nextReq - currentReq, 1) : 1;
    const progress = nextReq ? Math.min(Math.max(totalPoints - currentReq, 0), span) : 0;
    return { level, nextLevelPoints: nextReq, progressPct: Math.round((progress / span) * 100) };
  }
  let achievedLevel = 0;
  for (const l of levels) {
    if (l.isActive && l.pointsRequired <= totalPoints) achievedLevel = l.level;
  }
  // All users get at least level 1 (minimum level)
  // This ensures new users with 0 points are still classified
  if (achievedLevel === 0) {
    achievedLevel = 1;
  }
  const next = levels.find((l) => l.level === achievedLevel + 1) || null;
  const currentReq = levels.find((l) => l.level === achievedLevel)?.pointsRequired ?? 0;
  const nextReq = next?.pointsRequired ?? null;
  const span = nextReq ? Math.max(nextReq - currentReq, 1) : 1;
  const progress = nextReq ? Math.min(Math.max(totalPoints - currentReq, 0), span) : 0;
  return { level: achievedLevel, nextLevelPoints: nextReq, progressPct: Math.round((progress / span) * 100) };
}

export async function recomputeUserProgress(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const { level } = await computeLevelFromPoints(user.totalPoints ?? 0);
  const existingLatest = await prisma.userLevel.findFirst({
    where: { userId },
    orderBy: { reachedAt: "desc" },
  });
  const levelChanged = !existingLatest || existingLatest.level !== level;
  if (levelChanged) {
    await prisma.userLevel.create({ data: { userId, level, reachedAt: new Date() } });
    // Notify only if this is a level increase (not first level assignment)
    if (existingLatest && level > existingLatest.level) {
      try {
        await notifyLevelUp(userId, level);
      } catch {
        // Silently fail notifications - don't block progress tracking
      }
    }
  }
  const tier = await getTierForLevel(level);
  if (tier) {
    const latestTier = await prisma.userTierHistory.findFirst({
      where: { userId },
      orderBy: { reachedAt: "desc" },
    });
    const tierChanged = !latestTier || latestTier.tierId !== tier.id;
    if (tierChanged) {
      await prisma.userTierHistory.create({ data: { userId, tierId: tier.id, reachedAt: new Date() } });
      // Notify only if this is a tier upgrade (not first tier assignment)
      if (latestTier) {
        try {
          await notifyTierUpgrade(userId, tier.id, tier.name);
        } catch {
          // Silently fail notifications - don't block progress tracking
        }
      }
    }
  }
  return { level, tierId: tier?.id ?? null };
}

export async function recomputeAllUsers(batchSize: number = 200) {
  let cursor: string | null = null;
  // simple batching using id ordering
  let hasMore = true;
  while (hasMore) {
    const users: Array<{ id: string }> = await prisma.user.findMany({
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true },
    });
    if (users.length === 0) {
      hasMore = false;
      break;
    }
    for (const u of users) {
      await recomputeUserProgress(u.id);
    }
    cursor = users[users.length - 1].id;
  }
}


