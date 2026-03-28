import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { runTopicPublish } from "@/lib/services/topic-content/pipeline.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const snapshot = await runTopicPublish(id);
    revalidatePath("/sitemap.xml");
    return successResponse({ topicId: id, snapshotId: snapshot.id, status: "PUBLISHED" });
  } catch (error) {
    return handleError(error);
  }
}
