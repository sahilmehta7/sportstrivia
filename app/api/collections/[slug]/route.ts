import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { handleError, successResponse } from "@/lib/errors";
import { getPublishedCollectionDetail } from "@/lib/services/collection.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await params;
    const result = await getPublishedCollectionDetail(slug, session?.user?.id);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
