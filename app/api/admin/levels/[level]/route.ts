import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";

// GET /api/admin/levels/[level]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ level: string }> }
) {
  try {
    await requireAdmin();
    const { level } = await params;
    const lvl = await prisma.level.findUnique({ where: { level: Number(level) } });
    if (!lvl) throw new NotFoundError("Level not found");
    return successResponse({ level: lvl });
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/levels/[level]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ level: string }> }
) {
  try {
    await requireAdmin();
    const { level } = await params;
    const body = await request.json();
    const pointsRequired = Number(body?.pointsRequired);
    const isActive = body?.isActive ?? true;
    if (!Number.isFinite(pointsRequired) || pointsRequired < 0) throw new BadRequestError("Invalid pointsRequired");
    const updated = await prisma.level.update({
      where: { level: Number(level) },
      data: { pointsRequired, isActive },
    });
    return successResponse({ level: updated });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/levels/[level]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ level: string }> }
) {
  try {
    await requireAdmin();
    const { level } = await params;
    const lvlnum = Number(level);
    if (lvlnum === 1) throw new BadRequestError("Cannot delete level 1");
    await prisma.level.delete({ where: { level: lvlnum } });
    return successResponse({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}


