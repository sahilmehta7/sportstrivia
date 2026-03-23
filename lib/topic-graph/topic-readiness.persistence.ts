import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { evaluateTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.service";

async function loadTopicEntityReadinessInput(topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      entityStatus: true,
      entityValidatedAt: true,
      schemaType: true,
      schemaCanonicalUrl: true,
      schemaEntityData: true,
      outgoingRelations: {
        select: {
          fromTopicId: true,
          toTopicId: true,
          relationType: true,
        },
      },
    },
  });

  if (!topic) {
    throw new NotFoundError("Topic not found");
  }

  return topic;
}

export async function getTopicEntityReadiness(topicId: string) {
  const topic = await loadTopicEntityReadinessInput(topicId);
  const readiness = evaluateTopicEntityReadiness({
    schemaType: topic.schemaType,
    schemaCanonicalUrl: topic.schemaCanonicalUrl,
    schemaEntityData:
      topic.schemaEntityData && typeof topic.schemaEntityData === "object"
        ? (topic.schemaEntityData as Record<string, unknown>)
        : null,
    relations: topic.outgoingRelations,
  });

  return {
    ...readiness,
    topicId: topic.id,
    storedEntityStatus: topic.entityStatus,
    storedEntityValidatedAt: topic.entityValidatedAt?.toISOString() ?? null,
  };
}

export async function syncTopicEntityReadiness(topicId: string) {
  const readiness = await getTopicEntityReadiness(topicId);

  await prisma.topic.update({
    where: { id: topicId },
    data: {
      entityStatus: readiness.entityStatus,
      entityValidatedAt: readiness.isReady ? new Date() : null,
    },
  });

  return readiness;
}
