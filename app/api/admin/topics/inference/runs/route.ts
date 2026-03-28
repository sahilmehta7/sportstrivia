import { NextRequest, after } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { createBackgroundTask } from "@/lib/services/background-task.service";
import { processTopicInferenceTask } from "@/lib/services/topic-inference-task.service";

export const runtime = "nodejs";
export const maxDuration = 10;

const schema = z.object({
  runMode: z.enum(["dry_run", "apply_safe_relations"]).default("dry_run"),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await request.json().catch(() => ({})));
    const task = await createBackgroundTask({
      userId: admin.id,
      type: BackgroundTaskType.TOPIC_RELATION_INFERENCE,
      label: "Topic relation inference",
      input: body,
    });
    after(async () => processTopicInferenceTask(task.id));
    return successResponse({ taskId: task.id, attempt: (task as any).attempt ?? 1, status: "processing" });
  } catch (error) {
    return handleError(error);
  }
}
