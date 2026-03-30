import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import {
  addQuizToCollection,
  removeQuizFromCollection,
  reorderCollectionQuizzes,
} from "@/lib/services/collection.service";

const addSchema = z.object({
  quizId: z.string().cuid(),
  order: z.number().int().positive().optional(),
});

const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        quizId: z.string().cuid(),
        order: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = addSchema.parse(await request.json());
    const result = await addQuizToCollection(id, body);
    return successResponse(result, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = reorderSchema.parse(await request.json());
    const result = await reorderCollectionQuizzes(id, body.items);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const quizId = z.string().cuid().parse(searchParams.get("quizId"));
    const result = await removeQuizFromCollection(id, quizId);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
