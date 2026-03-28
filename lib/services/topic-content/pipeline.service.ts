import { prisma } from "@/lib/db";
import { collectTopicSourceDocuments } from "@/lib/services/topic-content/collect.service";
import { generateTopicContentSnapshot } from "@/lib/services/topic-content/generate.service";
import { normalizeTopicSourceDocuments } from "@/lib/services/topic-content/normalize.service";
import { publishTopicContentSnapshot } from "@/lib/services/topic-content/publish.service";
import { createIngestionRun, markRunFinished, markRunRunning } from "@/lib/services/topic-content/run.service";
import { scoreTopicContentSnapshot } from "@/lib/services/topic-content/score.service";
import { verifyTopicClaims } from "@/lib/services/topic-content/verify.service";
import type { TopicContentStage } from "@/lib/services/topic-content/types";
import type { Prisma } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";

function toInputJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return null;
  }
}

async function executeStage<T>(
  topicId: string,
  stage: TopicContentStage,
  fn: () => Promise<T>
): Promise<T> {
  const run = await createIngestionRun(topicId, stage);
  await markRunRunning(run.id);
  try {
    const result = await fn();
    await markRunFinished(run.id, "SUCCEEDED", { metrics: toInputJsonValue(result) });
    return result;
  } catch (error: any) {
    await markRunFinished(run.id, "FAILED", { error: error?.message ?? "Unknown stage failure" });
    throw error;
  }
}

export async function runTopicIngestionPipeline(topicId: string, mode: "full" | "refresh" = "full") {
  const collect = await executeStage(topicId, "COLLECT", () => collectTopicSourceDocuments(topicId, mode));
  const normalize = await executeStage(topicId, "NORMALIZE", () => normalizeTopicSourceDocuments(topicId));
  const verify = await executeStage(topicId, "VERIFY", () => verifyTopicClaims(topicId));
  return { collect, normalize, verify };
}

export async function runTopicGenerationAndScoring(topicId: string) {
  const snapshot = await executeStage(topicId, "GENERATE", () => generateTopicContentSnapshot(topicId));
  const score = await executeStage(topicId, "SCORE", () => scoreTopicContentSnapshot(topicId, snapshot.id));
  return { snapshot, score };
}

export async function runTopicPublish(topicId: string) {
  return executeStage(topicId, "PUBLISH", () => publishTopicContentSnapshot(topicId));
}

export async function getTopicContentStatus(topicId: string) {
  const [topic, latestRun, latestSnapshot, latestReadySnapshot, sourceDocumentCount, distinctSourceCount, claimStats] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        contentStatus: true,
        contentQualityScore: true,
        contentLastReviewedAt: true,
        indexEligible: true,
      },
    }),
    prisma.topicIngestionRun.findFirst({
      where: { topicId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.topicContentSnapshot.findFirst({
      where: { topicId },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        status: true,
        qualityScore: true,
        citationCoverage: true,
        thinRiskScore: true,
        wordCount: true,
        publishedAt: true,
        lastReviewedAt: true,
      },
    }),
    prisma.topicContentSnapshot.findFirst({
      where: { topicId, status: "READY" },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
      },
    }),
    prisma.topicSourceDocument.count({
      where: { topicId },
    }),
    prisma.topicSourceDocument
      .findMany({
        where: { topicId },
        select: { sourceName: true },
        distinct: ["sourceName"],
      })
      .then((rows) => rows.length),
    prisma.topicClaim.aggregate({
      where: { topicId },
      _count: {
        _all: true,
      },
    }),
  ]);

  if (!topic) {
    throw new NotFoundError("Topic not found");
  }

  return {
    topic,
    latestRun,
    latestSnapshot,
    hasReadySnapshot: Boolean(latestReadySnapshot),
    latestReadySnapshot,
    sourceDocumentCount,
    distinctSourceCount,
    claimCount: claimStats._count._all,
  };
}

export async function getTopicContentPreview(topicId: string) {
  const snapshot = await prisma.topicContentSnapshot.findFirst({
    where: { topicId },
    orderBy: { version: "desc" },
  });
  if (!snapshot) {
    throw new NotFoundError("No snapshot available for preview");
  }

  const selectedClaims = await prisma.topicClaim.findMany({
    where: { topicId, isSelectedForPublish: true, isContradicted: false },
    select: { id: true, claimText: true, sourceDocumentId: true },
    take: 100,
  });

  return {
    snapshot,
    citationMap: selectedClaims,
  };
}
