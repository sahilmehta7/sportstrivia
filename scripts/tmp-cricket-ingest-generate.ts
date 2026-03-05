import { runTopicIngestionPipeline, runTopicGenerationAndScoring, getTopicContentStatus } from '@/lib/services/topic-content/pipeline.service';

const topicId = 'cmgrx8q5z0004qmg1vgiq1v2z';

(async () => {
  const ingest = await runTopicIngestionPipeline(topicId, 'full');
  const generated = await runTopicGenerationAndScoring(topicId);
  const status = await getTopicContentStatus(topicId);

  console.log(JSON.stringify({
    topicId,
    ingest,
    generated: {
      snapshot: {
        id: generated.snapshot.id,
        version: generated.snapshot.version,
        status: generated.snapshot.status,
        title: generated.snapshot.title,
      },
      score: {
        passed: generated.score.passed,
        metrics: generated.score.metrics,
        snapshotStatus: generated.score.snapshot.status,
      },
    },
    status: {
      contentStatus: status.topic.contentStatus,
      contentQualityScore: status.topic.contentQualityScore,
      indexEligible: status.topic.indexEligible,
      hasReadySnapshot: status.hasReadySnapshot,
      latestSnapshot: status.latestSnapshot,
      sourceDocumentCount: status.sourceDocumentCount,
      claimCount: status.claimCount,
    },
  }, null, 2));
})();
