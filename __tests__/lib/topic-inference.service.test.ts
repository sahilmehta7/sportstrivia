import {
  analyzeTopicHierarchy,
  buildTypedTopicReportRows,
  buildUntypedTopicReportRows,
  type TopicHierarchyNode,
} from "@/lib/topic-graph/topic-inference.service";

describe("topic inference service", () => {
  const topics: TopicHierarchyNode[] = [
    {
      id: "root",
      name: "Sports",
      slug: "sports",
      schemaType: "NONE",
      parentId: null,
      level: 0,
      alternateNames: [],
    },
    {
      id: "sport_1",
      name: "Cricket",
      slug: "cricket",
      schemaType: "SPORT",
      parentId: "root",
      level: 1,
      alternateNames: [],
    },
    {
      id: "bucket_1",
      name: "IPL Teams",
      slug: "ipl-teams",
      schemaType: "NONE",
      parentId: "sport_1",
      level: 2,
      alternateNames: [],
    },
    {
      id: "team_1",
      name: "Mumbai Indians",
      slug: "mumbai-indians",
      schemaType: "SPORTS_TEAM",
      parentId: "bucket_1",
      level: 3,
      alternateNames: ["MI"],
    },
    {
      id: "athlete_1",
      name: "Virat Kohli",
      slug: "virat-kohli",
      schemaType: "ATHLETE",
      parentId: "team_1",
      level: 4,
      alternateNames: [],
    },
    {
      id: "event_1",
      name: "IPL 2025 Final",
      slug: "ipl-2025-final",
      schemaType: "SPORTS_EVENT",
      parentId: "bucket_1",
      level: 3,
      alternateNames: [],
    },
    {
      id: "org_1",
      name: "BCCI",
      slug: "bcci",
      schemaType: "SPORTS_ORGANIZATION",
      parentId: "sport_1",
      level: 2,
      alternateNames: [],
    },
    {
      id: "untyped_1",
      name: "India Cricket",
      slug: "india-cricket",
      schemaType: "NONE",
      parentId: "sport_1",
      level: 2,
      alternateNames: [],
    },
    {
      id: "broken_team",
      name: "Mystery Club",
      slug: "mystery-club",
      schemaType: "SPORTS_TEAM",
      parentId: null,
      level: 0,
      alternateNames: [],
    },
    {
      id: "badly_typed",
      name: "Football",
      slug: "football",
      schemaType: "SPORTS_TEAM",
      parentId: "root",
      level: 1,
      alternateNames: [],
    },
  ];

  it("resolves the nearest sport ancestor through NONE buckets", () => {
    const analysis = analyzeTopicHierarchy(topics);

    const teamRow = analysis.typedTopics.find((row) => row.topicId === "team_1");
    expect(teamRow?.nearestSportAncestorId).toBe("sport_1");
    expect(teamRow?.inferredRelations).toEqual([
      {
        fromTopicId: "team_1",
        toTopicId: "sport_1",
        relationType: "BELONGS_TO_SPORT",
        reason: "nearest_sport_ancestor",
      },
    ]);
  });

  it("infers BELONGS_TO_SPORT for all supported non-sport typed topics", () => {
    const analysis = analyzeTopicHierarchy(topics);

    expect(analysis.inferredRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromTopicId: "team_1", toTopicId: "sport_1" }),
        expect.objectContaining({ fromTopicId: "athlete_1", toTopicId: "sport_1" }),
        expect.objectContaining({ fromTopicId: "event_1", toTopicId: "sport_1" }),
        expect.objectContaining({ fromTopicId: "org_1", toTopicId: "sport_1" }),
      ])
    );
  });

  it("skips typed topics when no valid sport ancestor exists", () => {
    const analysis = analyzeTopicHierarchy(topics);

    expect(analysis.skippedTopics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          topicId: "broken_team",
          reason: "missing_sport_ancestor",
        }),
      ])
    );
  });

  it("flags likely mis-typed sport/category nodes as anomalies", () => {
    const analysis = analyzeTopicHierarchy(topics);

    expect(analysis.anomalyTopics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          topicId: "badly_typed",
          anomalyCode: "LIKELY_SPORT_MISCLASSIFIED_AS_TEAM",
        }),
      ])
    );
  });

  it("partitions typed and untyped topics for reporting", () => {
    const analysis = analyzeTopicHierarchy(topics);

    expect(analysis.typedTopics.map((row) => row.topicId)).toEqual(
      expect.arrayContaining(["sport_1", "team_1", "athlete_1", "event_1", "org_1", "broken_team", "badly_typed"])
    );
    expect(analysis.untypedTopics.map((row) => row.topicId)).toEqual(
      expect.arrayContaining(["root", "bucket_1", "untyped_1"])
    );
  });

  it("builds stable typed and untyped report rows", () => {
    const analysis = analyzeTopicHierarchy(topics);

    expect(buildTypedTopicReportRows(analysis)[0]).toEqual(
      expect.objectContaining({
        topicId: expect.any(String),
        currentSchemaType: expect.any(String),
        nearestSportAncestorSlug: expect.any(String),
        anomalyCodes: expect.any(String),
      })
    );

    expect(buildUntypedTopicReportRows(analysis)[0]).toEqual(
      expect.objectContaining({
        topicId: expect.any(String),
        suggestedAction: expect.any(String),
        ancestorPath: expect.any(String),
      })
    );
  });
});
