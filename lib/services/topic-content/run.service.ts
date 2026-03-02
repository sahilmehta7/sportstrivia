import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { TopicContentRunStatus, TopicContentStage } from "@/lib/services/topic-content/types";

export async function createIngestionRun(topicId: string, stage: TopicContentStage) {
  return prisma.topicIngestionRun.create({
    data: {
      topicId,
      stage,
      status: "QUEUED",
    },
  });
}

export async function markRunRunning(runId: string) {
  return prisma.topicIngestionRun.update({
    where: { id: runId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
    },
  });
}

export async function markRunFinished(
  runId: string,
  status: TopicContentRunStatus,
  options?: { error?: string | null; metrics?: Prisma.InputJsonValue | null }
) {
  return prisma.topicIngestionRun.update({
    where: { id: runId },
    data: {
      status,
      endedAt: new Date(),
      error: options?.error ?? null,
      metrics: options?.metrics ?? undefined,
    },
  });
}
