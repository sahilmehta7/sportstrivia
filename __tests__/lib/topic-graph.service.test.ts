import {
  normalizeAlternateNames,
  validateTopicRelation,
  evaluateTopicEntityReadiness,
} from "@/lib/topic-graph/topic-readiness.service";

describe("topic entity graph helpers", () => {
  it("normalizes alternate names by trimming, deduplicating, and removing canonical duplicates", () => {
    expect(
      normalizeAlternateNames("Mumbai Indians", [" MI ", "mi", "Mumbai Indians", "", "Mumbai Indians "])
    ).toEqual(["MI"]);
  });

  it("rejects self relations", () => {
    expect(() =>
      validateTopicRelation({
        fromTopicId: "topic_1",
        toTopicId: "topic_1",
        fromSchemaType: "SPORTS_TEAM",
        toSchemaType: "SPORTS_TEAM",
        relationType: "RIVAL_OF",
      })
    ).toThrow("A topic cannot be related to itself");
  });

  it("rejects invalid relation type pairings", () => {
    expect(() =>
      validateTopicRelation({
        fromTopicId: "topic_athlete",
        toTopicId: "topic_event",
        fromSchemaType: "ATHLETE",
        toSchemaType: "SPORTS_EVENT",
        relationType: "PLAYS_FOR",
      })
    ).toThrow("Invalid relation pairing");
  });

  it("accepts valid relation type pairings", () => {
    expect(
      validateTopicRelation({
        fromTopicId: "topic_athlete",
        toTopicId: "topic_team",
        fromSchemaType: "ATHLETE",
        toSchemaType: "SPORTS_TEAM",
        relationType: "PLAYS_FOR",
      })
    ).toEqual(true);
  });

  it("marks non-sport entities as not ready when sport anchor is missing", () => {
    expect(
      evaluateTopicEntityReadiness({
        schemaType: "SPORTS_TEAM",
        schemaCanonicalUrl: "https://example.com/team",
        schemaEntityData: { sportName: "Cricket" },
        relations: [],
      })
    ).toMatchObject({
      isReady: false,
      entityStatus: "NEEDS_REVIEW",
      errors: [expect.stringContaining("exactly one BELONGS_TO_SPORT")],
    });
  });

  it("marks typed sport entity as ready without sport anchor relation", () => {
    expect(
      evaluateTopicEntityReadiness({
        schemaType: "SPORT",
        schemaCanonicalUrl: "https://example.com/cricket",
        schemaEntityData: { governingBodyName: "ICC" },
        relations: [],
      })
    ).toMatchObject({
      isReady: true,
      entityStatus: "READY",
      errors: [],
    });
  });

  it("marks non-sport entities as ready when canonical url, entity data, and single sport anchor exist", () => {
    expect(
      evaluateTopicEntityReadiness({
        schemaType: "SPORTS_TEAM",
        schemaCanonicalUrl: "https://example.com/team",
        schemaEntityData: { sportName: "Cricket" },
        relations: [
          {
            fromTopicId: "topic_team",
            toTopicId: "topic_sport",
            relationType: "BELONGS_TO_SPORT",
          },
        ],
      })
    ).toMatchObject({
      isReady: true,
      entityStatus: "READY",
      errors: [],
    });
  });
});
