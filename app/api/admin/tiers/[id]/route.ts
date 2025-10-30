import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";

// GET /api/admin/tiers/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const tier = await prisma.tier.findUnique({ where: { id: Number(id) } });
    if (!tier) throw new NotFoundError("Tier not found");
    return successResponse({ tier });
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/tiers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const startLevel = Number(body?.startLevel);
    const endLevel = Number(body?.endLevel);
    if (startLevel && endLevel && startLevel > endLevel) throw new BadRequestError("Invalid level range");
    const updated = await prisma.tier.update({ where: { id: Number(id) }, data: body });
    return successResponse({ tier: updated });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/tiers/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.tier.delete({ where: { id: Number(id) } });
    return successResponse({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}


