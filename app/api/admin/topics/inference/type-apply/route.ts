import { NextRequest, after } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { TOPIC_SCHEMA_TYPES } from "@/lib/topic-schema-options";
import { createBackgroundTask } from "@/lib/services/background-task.service";
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
    after(async () => {
      try {
        await processTopicTypeApplyTask(task.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[AI Task] after() callback failed", {
          taskId: task.id,
          taskType: BackgroundTaskType.TOPIC_TYPE_APPLY,
          message,
        });
      }
    });
    return successResponse({ taskId: task.id, attempt: (task as any).attempt ?? 1, status: "processing" });
  } catch (error) {
    return handleError(error);
  }
}
