import { computeAdminQualityFailures } from "@/lib/services/topic-content/admin-quality.service";

describe("topic content admin quality checks", () => {
  it("uses distinctSourceCount (not sourceDocumentCount) for distinct-source gate", () => {
    const failures = computeAdminQualityFailures({
      latestSnapshot: {
        status: "REJECTED",
        wordCount: 300,
        citationCoverage: 0.5,
        qualityScore: 90,
      },
      contentStatus: {
        sourceDocumentCount: 10,
        distinctSourceCount: 1,
      },
      contentPreview: {
        citationCount: 20,
      },
    });

    expect(failures).toContain("Distinct sources too low (1/2)");
  });
});
