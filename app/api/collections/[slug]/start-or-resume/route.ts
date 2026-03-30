import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { startOrResumeCollection } from "@/lib/services/collection.service";
import { resolveCollectionIdFromPathReference } from "@/lib/services/route-reference.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;
    const collectionId = await resolveCollectionIdFromPathReference(slug, {
      allowIdFallback: true,
    });
    const result = await startOrResumeCollection(user.id, collectionId);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
