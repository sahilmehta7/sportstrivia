import { runTopicGenerationAndScoring, getTopicContentStatus } from '@/lib/services/topic-content/pipeline.service';

const topicId = 'cmm8rk96o0001qmnbo4cxlh8w';

(async () => {
  const generated = await runTopicGenerationAndScoring(topicId);
  const status = await getTopicContentStatus(topicId);

  console.log(JSON.stringify({
    topicId,
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
    },
  }, null, 2));
})();
