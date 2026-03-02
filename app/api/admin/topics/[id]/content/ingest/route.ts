import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { runTopicIngestionPipeline } from "@/lib/services/topic-content/pipeline.service";

const ingestSchema = z.object({
  mode: z.enum(["full", "refresh"]).default("full"),
  force: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = ingestSchema.parse(body);

    const result = await runTopicIngestionPipeline(id, parsed.mode);
    return successResponse({
      topicId: id,
      mode: parsed.mode,
      force: parsed.force ?? false,
      result,
    });
  } catch (error) {
    return handleError(error);
  }
}
