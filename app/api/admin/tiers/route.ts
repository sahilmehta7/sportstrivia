import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { z } from "zod";

const tierSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(2),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  startLevel: z.number().int().min(1),
  endLevel: z.number().int().min(1),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  order: z.number().int().min(1),
});

// GET /api/admin/tiers - list tiers
export async function GET() {
  try {
    await requireAdmin();
    const tiers = await prisma.tier.findMany({ orderBy: { order: "asc" } });
    return successResponse({ tiers });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/tiers - bulk upsert
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const array = z.array(tierSchema).safeParse(body?.tiers ?? body);
    if (!array.success) throw new BadRequestError("Invalid tiers payload");
    const items = array.data;
    for (const item of items) {
      if (item.startLevel > item.endLevel) throw new BadRequestError("startLevel must be <= endLevel");
      if (item.id) {
        await prisma.tier.update({ where: { id: item.id }, data: item });
      } else {
        await prisma.tier.upsert({
          where: { slug: item.slug ?? `tier-${item.order}` },
          update: item,
          create: {
            name: item.name,
            slug: item.slug ?? item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^(-)+|(-)+$/g, ""),
            description: item.description ?? null,
            startLevel: item.startLevel,
            endLevel: item.endLevel,
            color: item.color ?? null,
            icon: item.icon ?? null,
            order: item.order,
          },
        });
      }
    }
    const tiers = await prisma.tier.findMany({ orderBy: { order: "asc" } });
    return successResponse({ tiers });
  } catch (error) {
    return handleError(error);
  }
}


