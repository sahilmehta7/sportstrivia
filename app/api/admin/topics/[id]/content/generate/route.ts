import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { handleError, successResponse } from "@/lib/errors";
import { runTopicGenerationAndScoring } from "@/lib/services/topic-content/pipeline.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const before = await prisma.topic.findUnique({
      where: { id },
      select: { indexEligible: true },
    });
    const result = await runTopicGenerationAndScoring(id);
    const after = await prisma.topic.findUnique({
      where: { id },
      select: { indexEligible: true },
    });
    if (before?.indexEligible !== after?.indexEligible) {
      revalidatePath("/sitemap.xml");
    }
    return successResponse({ topicId: id, ...result });
  } catch (error) {
    return handleError(error);
  }
}
