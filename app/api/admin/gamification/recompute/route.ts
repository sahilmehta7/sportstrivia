import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { computeLevelFromPoints, getTierForLevel } from "@/lib/services/gamification.service";

// POST /api/admin/gamification/recompute { dryRun?: boolean, limit?: number }
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);
    const limit = body?.limit && Number.isFinite(Number(body.limit)) ? Number(body.limit) : undefined;

    const users = await prisma.user.findMany({ orderBy: { id: "asc" }, take: limit });
    let updated = 0;
    for (const u of users) {
      const totalPoints = u.totalPoints ?? 0;
      const { level } = await computeLevelFromPoints(totalPoints);
      const tier = await getTierForLevel(level);
      if (!dryRun) {
        const latestLevel = await prisma.userLevel.findFirst({ where: { userId: u.id }, orderBy: { reachedAt: "desc" } });
        if (!latestLevel || latestLevel.level !== level) {
          await prisma.userLevel.create({ data: { userId: u.id, level, reachedAt: new Date() } });
        }
        if (tier) {
          const latestTier = await prisma.userTierHistory.findFirst({ where: { userId: u.id }, orderBy: { reachedAt: "desc" } });
          if (!latestTier || latestTier.tierId !== tier.id) {
            await prisma.userTierHistory.create({ data: { userId: u.id, tierId: tier.id, reachedAt: new Date() } });
          }
        }
      }
      updated++;
    }

    return successResponse({ processed: users.length, updated, dryRun: !!dryRun });
  } catch (error) {
    return handleError(error);
  }
}


