import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { z } from "zod";

const levelSchema = z.object({
  level: z.number().int().min(1).max(1000),
  pointsRequired: z.number().int().min(0),
  isActive: z.boolean().optional().default(true),
});

// GET /api/admin/levels - list all levels
export async function GET() {
  try {
    await requireAdmin();
    const levels = await prisma.level.findMany({ orderBy: { level: "asc" } });
    return successResponse({ levels });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/levels - bulk upsert levels
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const array = z.array(levelSchema).safeParse(body?.levels ?? body);
    if (!array.success) throw new BadRequestError("Invalid levels payload");
    const items = array.data;
    // Upsert sequentially to honor unique constraint on level
    for (const item of items) {
      await prisma.level.upsert({
        where: { level: item.level },
        update: { pointsRequired: item.pointsRequired, isActive: item.isActive ?? true },
        create: { level: item.level, pointsRequired: item.pointsRequired, isActive: item.isActive ?? true },
      });
    }
    const levels = await prisma.level.findMany({ orderBy: { level: "asc" } });
    return successResponse({ levels });
  } catch (error) {
    return handleError(error);
  }
}


