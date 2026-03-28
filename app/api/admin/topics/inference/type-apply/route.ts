import { NextRequest, after } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { TOPIC_SCHEMA_TYPES } from "@/lib/topic-schema-options";
import { createBackgroundTask, markBackgroundTaskFailed } from "@/lib/services/background-task.service";
import { processTopicTypeApplyTask, validateTopicTypeApplySelections } from "@/lib/services/topic-inference-task.service";

export const runtime = "nodejs";
export const maxDuration = 10;

const schema = z.object({
  sourceTaskId: z.string().min(1),
  selections: z.array(z.object({
    topicId: z.string().min(1),
    targetSchemaType: z.enum(TOPIC_SCHEMA_TYPES),
  })).min(1),
});

export async function POST(request: NextRequest) {
  let taskId: string | null = null;
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await request.json().catch(() => ({})));
    await validateTopicTypeApplySelections({
      sourceTaskId: body.sourceTaskId,
      selections: body.selections,
      requestingUserId: admin.id,
    });
    const task = await createBackgroundTask({
      userId: admin.id,
      type: BackgroundTaskType.TOPIC_TYPE_APPLY,
      label: "Topic type apply",
      input: body,
    });
    taskId = task.id;
    after(async () => {
      try {
        await processTopicTypeApplyTask(task.id);
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
