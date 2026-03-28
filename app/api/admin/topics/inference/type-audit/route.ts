import { NextRequest, after } from "next/server";
import { BackgroundTaskType } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { createBackgroundTask } from "@/lib/services/background-task.service";
import { processTopicTypeAuditTask } from "@/lib/services/topic-inference-task.service";

export const runtime = "nodejs";
export const maxDuration = 10;

const schema = z.object({
  reportKind: z.enum(["all", "typed_only", "untyped_only"]).default("all"),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await request.json().catch(() => ({})));
    const task = await createBackgroundTask({
      userId: admin.id,
      type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
      label: "Topic type audit",
      input: body,
    });
    after(async () => processTopicTypeAuditTask(task.id));
    return successResponse({ taskId: task.id, attempt: (task as any).attempt ?? 1, status: "processing" });
  } catch (error) {
    return handleError(error);
  }
}
