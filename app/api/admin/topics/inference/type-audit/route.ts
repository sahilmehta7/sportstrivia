import { NextRequest, after } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { createBackgroundTask, markBackgroundTaskFailed } from "@/lib/services/background-task.service";
import { processTopicTypeAuditTask } from "@/lib/services/topic-inference-task.service";

export const runtime = "nodejs";
export const maxDuration = 10;

const schema = z.object({
  reportKind: z.enum(["all", "typed_only", "untyped_only"]).default("all"),
});

export async function POST(request: NextRequest) {
  let taskId: string | null = null;
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await request.json().catch(() => ({})));
    const task = await createBackgroundTask({
      userId: admin.id,
      type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
      label: "Topic type audit",
      input: body,
    });
    taskId = task.id;
    after(async () => {
      try {
        await processTopicTypeAuditTask(task.id);
      } catch (processingError) {
        const message = processingError instanceof Error ? processingError.message : "Unknown background processing error";
        await markBackgroundTaskFailed(task.id, message);
      }
    });
    return successResponse({ taskId: task.id, status: "processing" });
  } catch (error) {
    if (taskId) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await markBackgroundTaskFailed(taskId, message);
    }
    return handleError(error);
  }
}
