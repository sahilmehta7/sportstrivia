import { prisma } from "@/lib/db";
import { syncTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.persistence";
import type { InferredRelation } from "@/lib/topic-graph/topic-inference.service";

export async function applyInferredSportRelations({
  inferredRelations,
  anomalyTopicIds,
}: {
  inferredRelations: InferredRelation[];
  anomalyTopicIds: string[];
}) {
  const anomalySet = new Set(anomalyTopicIds);
  let appliedCount = 0;
  let skippedCount = 0;

  for (const relation of inferredRelations) {
    if (relation.relationType !== "BELONGS_TO_SPORT" || anomalySet.has(relation.fromTopicId)) {
      skippedCount += 1;
      continue;
    }

    await prisma.topicRelation.upsert({
      where: {
        fromTopicId_toTopicId_relationType: {
          fromTopicId: relation.fromTopicId,
          toTopicId: relation.toTopicId,
          relationType: relation.relationType,
        },
      },
      update: {},
      create: {
        fromTopicId: relation.fromTopicId,
        toTopicId: relation.toTopicId,
        relationType: relation.relationType,
      },
    });

    await syncTopicEntityReadiness(relation.fromTopicId);
    appliedCount += 1;
  }

  return {
    appliedCount,
    skippedCount,
  };
}
