import { runTopicIngestionPipeline, runTopicGenerationAndScoring, getTopicContentStatus, getTopicContentPreview } from '@/lib/services/topic-content/pipeline.service';

const topicId = 'cmm8rk96o0001qmnbo4cxlh8w';

(async () => {
  const ingest = await runTopicIngestionPipeline(topicId, 'full');
  const generated = await runTopicGenerationAndScoring(topicId);
  const status = await getTopicContentStatus(topicId);
  const preview = await getTopicContentPreview(topicId);

  const output = {
    topicId,
    ingest,
    generated: {
      snapshot: {
        id: generated.snapshot.id,
        version: generated.snapshot.version,
        status: generated.snapshot.status,
        title: generated.snapshot.title,
        metaDescription: generated.snapshot.metaDescription,
      },
      score: generated.score,
    },
    status: {
      contentStatus: status.topic.contentStatus,
      contentQualityScore: status.topic.contentQualityScore,
      indexEligible: status.topic.indexEligible,
      latestRun: status.latestRun
        ? {
            stage: status.latestRun.stage,
            status: status.latestRun.status,
            error: status.latestRun.error,
            metrics: status.latestRun.metrics,
          }
        : null,
      latestSnapshot: status.latestSnapshot,
      sourceDocumentCount: status.sourceDocumentCount,
      claimCount: status.claimCount,
      hasReadySnapshot: status.hasReadySnapshot,
    },
    preview: {
      snapshot: {
        id: preview.snapshot.id,
        version: preview.snapshot.version,
        status: preview.snapshot.status,
        title: preview.snapshot.title,
        metaDescription: preview.snapshot.metaDescription,
        introMd: preview.snapshot.introMd,
        keyFactsMd: preview.snapshot.keyFactsMd,
        analysisMd: preview.snapshot.analysisMd,
        faqMd: preview.snapshot.faqMd,
        sourcesMd: preview.snapshot.sourcesMd,
        wordCount: preview.snapshot.wordCount,
        citationCoverage: preview.snapshot.citationCoverage,
        qualityScore: preview.snapshot.qualityScore,
      },
      selectedClaimCount: preview.citationMap.length,
      selectedClaimsSample: preview.citationMap.slice(0, 5),
    },
  };

  console.log(JSON.stringify(output, null, 2));
})();
