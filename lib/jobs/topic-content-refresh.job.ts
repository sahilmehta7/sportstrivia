import { prisma } from "@/lib/db";
import { runTopicGenerationAndScoring, runTopicIngestionPipeline } from "@/lib/services/topic-content/pipeline.service";

export async function runTopicContentRefreshJob(limit = 50) {
  const topics = await prisma.topic.findMany({
    where: {
      OR: [{ level: 1 }, { level: 2 }],
    },
    orderBy: [{ updatedAt: "desc" }],
    take: Math.max(1, Math.min(limit, 200)),
    select: { id: true, name: true },
  });

  const summary = {
    processed: 0,
    failed: 0,
    topics: [] as Array<{ topicId: string; name: string; status: "ok" | "failed"; error?: string }>,
  };

  for (const topic of topics) {
    try {
      await runTopicIngestionPipeline(topic.id, "refresh");
      await runTopicGenerationAndScoring(topic.id);
      summary.processed++;
      summary.topics.push({ topicId: topic.id, name: topic.name, status: "ok" });
    } catch (error: any) {
      summary.failed++;
      summary.topics.push({
        topicId: topic.id,
        name: topic.name,
        status: "failed",
        error: error?.message ?? "Unknown error",
      });
    }
  }

  return summary;
}
