import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { getTopicContentStatus } from "@/lib/services/topic-content/pipeline.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const status = await getTopicContentStatus(id);
    return successResponse(status);
  } catch (error) {
    return handleError(error);
  }
}
