import { NextRequest, after } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, NotFoundError, successResponse } from "@/lib/errors";
import { createBackgroundTask, getBackgroundTaskById } from "@/lib/services/background-task.service";
import {
  processTopicInferenceTask,
  processTopicTypeApplyTask,
  processTopicTypeAuditTask,
} from "@/lib/services/topic-inference-task.service";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const priorTask = await getBackgroundTaskById(id);
    if (!priorTask || (priorTask.userId && priorTask.userId !== admin.id)) {
      throw new NotFoundError("Task not found");
    }
    if (
      ![
        BackgroundTaskType.TOPIC_RELATION_INFERENCE,
        BackgroundTaskType.TOPIC_TYPE_AUDIT,
        BackgroundTaskType.TOPIC_TYPE_APPLY,
      ].includes(priorTask.type)
    ) {
      throw new NotFoundError("Task not found");
    }

    const task = await createBackgroundTask({
      userId: admin.id,
      type: priorTask.type,
      label: priorTask.label,
      input: priorTask.input ?? undefined,
    });
    after(async () => {
      if (priorTask.type === BackgroundTaskType.TOPIC_RELATION_INFERENCE) {
        await processTopicInferenceTask(task.id);
        return;
      }
      if (priorTask.type === BackgroundTaskType.TOPIC_TYPE_APPLY) {
        await processTopicTypeApplyTask(task.id);
        return;
      }
      await processTopicTypeAuditTask(task.id);
    });
    return successResponse({ taskId: task.id, attempt: (task as any).attempt ?? 1, status: "processing" });
  } catch (error) {
    return handleError(error);
  }
}
