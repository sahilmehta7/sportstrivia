import { NextRequest } from "next/server";
import { z } from "zod";
import { CollectionStatus, CollectionType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import {
  createCollection,
  listAdminCollections,
} from "@/lib/services/collection.service";

const statusSchema = z.nativeEnum(CollectionStatus);
const typeSchema = z.nativeEnum(CollectionType);

const createCollectionSchema = z.object({
  name: z.string().min(2).max(140),
  slug: z.string().min(2).max(180).optional(),
  description: z.string().max(1200).nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  seoTitle: z.string().max(120).nullable().optional(),
  seoDescription: z.string().max(320).nullable().optional(),
  status: statusSchema.optional(),
  type: typeSchema.optional(),
  isFeatured: z.boolean().optional(),
  primaryTopicId: z.string().cuid().nullable().optional(),
  rulesJson: z.unknown().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const result = await listAdminCollections({
      page,
      limit,
      search,
      status: status ? statusSchema.parse(status) : undefined,
      type: type ? typeSchema.parse(type) : undefined,
    });

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = createCollectionSchema.parse(await request.json());

    const created = await createCollection({
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
      coverImageUrl: body.coverImageUrl ?? null,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
      status: body.status,
      type: body.type,
      isFeatured: body.isFeatured,
      primaryTopicId: body.primaryTopicId ?? null,
      rulesJson: body.rulesJson as any,
    });

    return successResponse(created, 201);
  } catch (error) {
    return handleError(error);
  }
}
