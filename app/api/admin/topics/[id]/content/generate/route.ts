import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { runTopicGenerationAndScoring } from "@/lib/services/topic-content/pipeline.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const result = await runTopicGenerationAndScoring(id);
    return successResponse({ topicId: id, ...result });
  } catch (error) {
    return handleError(error);
  }
}
