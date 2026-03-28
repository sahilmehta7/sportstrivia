import {
  buildInferenceCsvArtifact,
  buildTopicTypeAuditCsvArtifact,
} from "@/lib/topic-graph/topic-inference-report.service";

describe("topic inference report builders", () => {
  it("builds separate typed and untyped CSV artifacts with stable headers", () => {
    const typed = buildInferenceCsvArtifact("typed", [
      {
        topicId: "team_1",
        name: "Mumbai Indians",
        slug: "mumbai-indians",
        currentSchemaType: "SPORTS_TEAM",
        level: 3,
        parentName: "IPL Teams",
        ancestorPath: "Sports > Cricket > IPL Teams",
        nearestSportAncestorName: "Cricket",
        nearestSportAncestorSlug: "cricket",
        inferredRelationTargetSlug: "cricket",
        anomalyCodes: "",
      },
    ]);

    expect(typed.filename).toBe("typed-topics-report.csv");
    expect(typed.contentType).toBe("text/csv; charset=utf-8");
    expect(typed.content).toContain("topicId,name,slug,currentSchemaType");
    expect(typed.content).toContain("team_1,Mumbai Indians,mumbai-indians,SPORTS_TEAM");

    const untyped = buildInferenceCsvArtifact("untyped", [
      {
        topicId: "bucket_1",
        name: "IPL Teams",
        slug: "ipl-teams",
        level: 2,
        parentName: "Cricket",
        ancestorPath: "Sports > Cricket",
        nearestTypedAncestorName: "Cricket",
        nearestTypedAncestorType: "SPORT",
        suggestedAction: "review_schema_type",
      },
    ]);

    expect(untyped.filename).toBe("untyped-topics-report.csv");
    expect(untyped.content).toContain("topicId,name,slug,level,parentName");
    expect(untyped.content).toContain("bucket_1,IPL Teams,ipl-teams,2,Cricket");
  });

  it("handles empty report rows", () => {
    const artifact = buildInferenceCsvArtifact("typed", []);

    expect(artifact.content.trim()).toBe("topicId,name,slug,currentSchemaType,level,parentName,ancestorPath,nearestSportAncestorName,nearestSportAncestorSlug,inferredRelationTargetSlug,anomalyCodes");
  });

  it("builds topic type audit artifacts with AI suggestion columns", () => {
    const artifact = buildTopicTypeAuditCsvArtifact("untyped", [
      {
        topicId: "bucket_1",
        name: "IPL Teams",
        slug: "ipl-teams",
        currentSchemaType: "NONE",
        ancestorPath: "Sports > Cricket",
        suggestedSchemaType: "SPORTS_EVENT",
        confidence: 0.86,
        rationale: "League or competition grouping inferred from ancestors and name",
      },
    ]);

    expect(artifact.filename).toBe("untyped-topics-report.csv");
    expect(artifact.content).toContain("suggestedSchemaType,confidence,rationale");
    expect(artifact.content).toContain("bucket_1,IPL Teams,ipl-teams,NONE");
  });
});
