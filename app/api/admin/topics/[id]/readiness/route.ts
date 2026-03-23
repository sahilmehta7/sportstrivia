import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { getTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.persistence";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const readiness = await getTopicEntityReadiness(id);

    return successResponse(readiness);
  } catch (error) {
    return handleError(error);
  }
}
