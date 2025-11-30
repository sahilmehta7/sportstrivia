import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { computeLevelFromPoints, getTierForLevel } from "@/lib/services/gamification.service";

// GET /api/users/me/gamification - current user's level/tier and thresholds
export async function GET() {
  try {
    const user = await requireAuth();
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { totalPoints: true } });
    const totalPoints = dbUser?.totalPoints ?? 0;
    const computed = await computeLevelFromPoints(totalPoints);
    const tier = await getTierForLevel(computed.level);
    let currentRequired = 0;
    try {
      // @ts-ignore safe access if model missing
      if ((prisma as any)?.level?.findUnique) {
        const currentLevel = await prisma.level.findUnique({ where: { level: computed.level } });
        currentRequired = currentLevel?.pointsRequired ?? 0;
      }
    } catch {
      // Silently fail - level model may not be available in all environments
    }
    const nextRequired = computed.nextLevelPoints ?? null;
    const span = nextRequired ? Math.max(nextRequired - currentRequired, 1) : 1;
    const progress = nextRequired ? Math.min(Math.max(totalPoints - currentRequired, 0), span) : span;
    return successResponse({
      level: computed.level,
      tierName: tier?.name ?? null,
      totalPoints,
      currentRequired,
      nextRequired,
      progress,
      span,
    });
  } catch (error) {
    return handleError(error);
  }
}


