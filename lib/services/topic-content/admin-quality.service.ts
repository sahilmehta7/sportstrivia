import { DEFAULT_QUALITY_GATE } from "@/lib/services/topic-content/types";

type AdminLatestSnapshot = {
  status: string;
  qualityScore: number;
  citationCoverage: number;
  wordCount: number;
};

type AdminContentStatus = {
  sourceDocumentCount?: number;
  distinctSourceCount?: number;
};

type AdminContentPreview = {
  citationCount: number;
};

export function computeAdminQualityFailures(input: {
  latestSnapshot: AdminLatestSnapshot | null;
  contentStatus: AdminContentStatus | null;
  contentPreview: AdminContentPreview | null;
}): string[] {
  const { latestSnapshot, contentStatus, contentPreview } = input;
  const qualityFailures: string[] = [];

  if (!latestSnapshot) {
    return qualityFailures;
  }

  if (latestSnapshot.wordCount < DEFAULT_QUALITY_GATE.minWordCount) {
    qualityFailures.push(
      `Word count too low (${latestSnapshot.wordCount}/${DEFAULT_QUALITY_GATE.minWordCount})`
    );
  }
  if (latestSnapshot.citationCoverage < DEFAULT_QUALITY_GATE.minCitationCoverage) {
    qualityFailures.push(
      `Citation coverage too low (${(latestSnapshot.citationCoverage * 100).toFixed(1)}%/${(
        DEFAULT_QUALITY_GATE.minCitationCoverage * 100
      ).toFixed(1)}%)`
    );
  }

  const distinctSourceCount = contentStatus?.distinctSourceCount ?? 0;
  if (distinctSourceCount < DEFAULT_QUALITY_GATE.minDistinctSources) {
    qualityFailures.push(
      `Distinct sources too low (${distinctSourceCount}/${DEFAULT_QUALITY_GATE.minDistinctSources})`
    );
  }

  const selectedClaims = contentPreview?.citationCount ?? 0;
  if (selectedClaims < DEFAULT_QUALITY_GATE.minSelectedClaims) {
    qualityFailures.push(
      `Selected claims too low (${selectedClaims}/${DEFAULT_QUALITY_GATE.minSelectedClaims})`
    );
  }

  if (latestSnapshot.qualityScore < DEFAULT_QUALITY_GATE.minQualityScore) {
    qualityFailures.push(
      `Quality score too low (${latestSnapshot.qualityScore.toFixed(1)}/${DEFAULT_QUALITY_GATE.minQualityScore})`
    );
  }

  return qualityFailures;
}
