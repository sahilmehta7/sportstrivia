import { prisma } from "@/lib/db";
import { DEFAULT_QUALITY_GATE } from "@/lib/services/topic-content/types";

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function computeCitationCoverage(snapshotText: string, distinctSources: number): number {
  if (!snapshotText.trim()) return 0;

  const markdownRefUrls = (snapshotText.match(/\((https?:\/\/[^)\s]+)\)/g) ?? []).map((item) =>
    item.slice(1, -1)
  );
  const bareUrlMatches = snapshotText.match(/https?:\/\/[^\s)]+/g) ?? [];

  const uniqueReferences = new Set<string>([
    ...markdownRefUrls.map((url) => url.toLowerCase()),
    ...bareUrlMatches.map((url) => url.toLowerCase()),
  ]);

  const evidenceSignals = uniqueReferences.size + Math.min(distinctSources, 3);
  const rawCoverage = Math.min(1, evidenceSignals / 8);
  return Number(rawCoverage.toFixed(3));
}

export function computeQualityScore(input: {
  wordCount: number;
  selectedClaims: number;
  distinctSources: number;
  citationCoverage: number;
}) {
  // Scoring targets are higher than hard gate minima to preserve score spread.
  const SCORING_TARGETS = {
    wordCount: 280,
    selectedClaims: 14,
    distinctSources: 3,
    citationCoverage: 0.6,
  };

  const wordScore = Math.min(30, (input.wordCount / SCORING_TARGETS.wordCount) * 30);
  const claimScore = Math.min(25, (input.selectedClaims / SCORING_TARGETS.selectedClaims) * 25);
  const sourceScore = Math.min(20, (input.distinctSources / SCORING_TARGETS.distinctSources) * 20);
  const citationScore = Math.min(25, (input.citationCoverage / SCORING_TARGETS.citationCoverage) * 25);
  const qualityScore = Number((wordScore + claimScore + sourceScore + citationScore).toFixed(2));
  const thinRiskScore = Number((100 - qualityScore).toFixed(2));
  return { qualityScore, thinRiskScore };
}

export async function scoreTopicContentSnapshot(topicId: string, snapshotId: string) {
  const [snapshot, selectedClaims, docs] = await Promise.all([
    prisma.topicContentSnapshot.findUnique({
      where: { id: snapshotId },
    }),
    prisma.topicClaim.count({
      where: { topicId, isSelectedForPublish: true, isContradicted: false },
    }),
    prisma.topicSourceDocument.findMany({
      where: { topicId },
      select: { sourceName: true },
      distinct: ["sourceName"],
    }),
  ]);

  if (!snapshot) {
    throw new Error("Snapshot not found");
  }

  const combinedText = [
    snapshot.introMd,
    snapshot.keyFactsMd,
    snapshot.timelineMd ?? "",
    snapshot.analysisMd,
    snapshot.faqMd,
    snapshot.sourcesMd,
  ].join("\n\n");

  const wordCount = countWords(combinedText);
  const distinctSources = docs.length;
  const citationCoverage = computeCitationCoverage(combinedText, distinctSources);
  const { qualityScore, thinRiskScore } = computeQualityScore({
    wordCount,
    selectedClaims,
    distinctSources,
    citationCoverage,
  });

  const passed =
    wordCount >= DEFAULT_QUALITY_GATE.minWordCount &&
    selectedClaims >= DEFAULT_QUALITY_GATE.minSelectedClaims &&
    distinctSources >= DEFAULT_QUALITY_GATE.minDistinctSources &&
    citationCoverage >= DEFAULT_QUALITY_GATE.minCitationCoverage &&
    qualityScore >= DEFAULT_QUALITY_GATE.minQualityScore;

  const updated = await prisma.topicContentSnapshot.update({
    where: { id: snapshot.id },
    data: {
      wordCount,
      citationCoverage,
      qualityScore,
      thinRiskScore,
      status: passed ? "READY" : "REJECTED",
      lastReviewedAt: new Date(),
    },
  });

  await prisma.topic.update({
    where: { id: topicId },
    data: {
      contentStatus: passed ? "READY" : "DRAFT",
      contentQualityScore: qualityScore,
      contentLastReviewedAt: new Date(),
      indexEligible: passed,
    },
  });

  return {
    snapshot: updated,
    passed,
    metrics: { wordCount, selectedClaims, distinctSources, citationCoverage, qualityScore, thinRiskScore },
  };
}
