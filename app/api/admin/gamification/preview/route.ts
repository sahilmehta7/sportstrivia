import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { LEVELS_MAX, pointsForLevel } from "@/lib/config/gamification";

// GET /api/admin/gamification/preview?levels=100
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const levelsParam = Number(searchParams.get("levels") || LEVELS_MAX);
    const limit = Number.isFinite(levelsParam) ? Math.min(levelsParam, LEVELS_MAX) : LEVELS_MAX;

    const overrides = await prisma.level.findMany({ orderBy: { level: "asc" } });
    const mapOverride = new Map(overrides.map((l) => [l.level, l.pointsRequired]));
    const rows = Array.from({ length: limit }, (_, i) => {
      const level = i + 1;
      const curve = pointsForLevel(level);
      const override = mapOverride.get(level) ?? null;
      const effective = override ?? curve;
      return { level, curve, override, effective };
    });

    return successResponse({ preview: rows });
  } catch (error) {
    return handleError(error);
  }
}


