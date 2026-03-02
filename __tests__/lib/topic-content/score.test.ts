import { computeQualityScore } from "@/lib/services/topic-content/score.service";

describe("topic content score", () => {
  it("computes bounded quality and thin-risk scores", () => {
    const result = computeQualityScore({
      wordCount: 1200,
      selectedClaims: 10,
      distinctSources: 4,
      citationCoverage: 0.9,
    });

    expect(result.qualityScore).toBeGreaterThan(0);
    expect(result.qualityScore).toBeLessThanOrEqual(100);
    expect(result.thinRiskScore).toBeCloseTo(100 - result.qualityScore, 1);
  });
});
