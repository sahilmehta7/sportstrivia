import { normalizeTopicTypeAuditResult, buildTopicTypeAuditPromptInput } from "@/lib/topic-graph/topic-type-audit.service";

describe("topic type audit service", () => {
  it("builds prompt input from topic context", () => {
    const input = buildTopicTypeAuditPromptInput({
      topic: {
        id: "bucket_1",
        name: "IPL Teams",
        slug: "ipl-teams",
        schemaType: "NONE",
        description: null,
        alternateNames: [],
      },
      ancestors: [
        { name: "Sports", schemaType: "NONE" },
        { name: "Cricket", schemaType: "SPORT" },
      ],
      children: [
        { name: "Mumbai Indians", schemaType: "SPORTS_TEAM" },
      ],
      inferenceHints: {
        nearestSportAncestorName: "Cricket",
      },
    });

    expect(input).toEqual(
      expect.objectContaining({
        topicName: "IPL Teams",
        topicSlug: "ipl-teams",
        currentSchemaType: "NONE",
        ancestorPath: "Sports > Cricket",
        childSummaries: ["Mumbai Indians (SPORTS_TEAM)"],
      })
    );
  });

  it("normalizes valid AI output into review-only suggestions", () => {
    const normalized = normalizeTopicTypeAuditResult({
      suggestedSchemaType: "SPORTS_EVENT",
      confidence: 0.91,
      rationale: "The topic appears to group a competition structure.",
    });

    expect(normalized).toEqual({
      suggestedSchemaType: "SPORTS_EVENT",
      confidence: 0.91,
      rationale: "The topic appears to group a competition structure.",
    });
  });

  it("captures malformed AI output as a failed suggestion row shape", () => {
    const normalized = normalizeTopicTypeAuditResult({
      suggestedSchemaType: "INVALID_TYPE",
      confidence: "high",
      rationale: 42,
    });

    expect(normalized).toEqual({
      suggestedSchemaType: null,
      confidence: null,
      rationale: "Invalid AI classification payload",
    });
  });
});
