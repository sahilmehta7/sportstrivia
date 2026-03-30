import { NextRequest } from "next/server";
import { z } from "zod";
import { CollectionStatus, CollectionType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { updateCollection } from "@/lib/services/collection.service";

const updateCollectionSchema = z.object({
  name: z.string().min(2).max(140).optional(),
  slug: z.string().min(2).max(180).optional(),
  description: z.string().max(1200).nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  seoTitle: z.string().max(120).nullable().optional(),
  seoDescription: z.string().max(320).nullable().optional(),
  status: z.nativeEnum(CollectionStatus).optional(),
  type: z.nativeEnum(CollectionType).optional(),
  isFeatured: z.boolean().optional(),
  primaryTopicId: z.string().cuid().nullable().optional(),
  rulesJson: z.unknown().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateCollectionSchema.parse(await request.json());

    const updated = await updateCollection(id, {
      ...body,
      rulesJson: body.rulesJson as any,
    });

    return successResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}
