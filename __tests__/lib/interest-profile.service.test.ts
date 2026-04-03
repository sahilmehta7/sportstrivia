/** @jest-environment node */

import {
  computeInterestProfile,
} from "@/lib/services/interest-profile.service";
import { isFollowableTopicSchemaType } from "@/lib/topic-followability";

describe("interest profile service", () => {
  it("allows only typed topic schema types for followability", () => {
    expect(isFollowableTopicSchemaType("SPORT")).toBe(true);
    expect(isFollowableTopicSchemaType("SPORTS_TEAM")).toBe(true);
    expect(isFollowableTopicSchemaType("ATHLETE")).toBe(true);
    expect(isFollowableTopicSchemaType("SPORTS_EVENT")).toBe(true);
    expect(isFollowableTopicSchemaType("SPORTS_ORGANIZATION")).toBe(true);
    expect(isFollowableTopicSchemaType("NONE")).toBe(false);
  });

  it("derives follows from explicit interests and ranks inferred behavior below explicit", () => {
    const profile = computeInterestProfile({
      userId: "user_1",
      explicitInterests: [
        {
          topicId: "team_india",
          slug: "india-cricket-team",
          name: "India",
          schemaType: "SPORTS_TEAM",
          source: "PROFILE",
          strength: 1,
        },
        {
          topicId: "sport_cricket",
          slug: "cricket",
          name: "Cricket",
          schemaType: "SPORT",
          source: "ONBOARDING",
          strength: 1,
        },
      ],
      topicStats: [
        {
          topicId: "athlete_kohli",
          slug: "virat-kohli",
          name: "Virat Kohli",
          schemaType: "ATHLETE",
          questionsAnswered: 12,
          successRate: 80,
          lastAnsweredAt: new Date().toISOString(),
        },
      ],
      searchSignals: [],
      preferences: {
        preferredDifficulty: "MEDIUM",
        preferredPlayModes: ["STANDARD"],
      },
    });

    expect(profile.summary.topEntities).toEqual(expect.arrayContaining(["India", "Cricket"]));
    expect(profile.follows.map((entry) => entry.topicId)).toEqual(
      expect.arrayContaining(["team_india", "sport_cricket"])
    );
    expect(profile.follows.every((entry) => entry.score === 100)).toBe(true);
    expect(profile.explicit[0].score).toBeGreaterThan(profile.inferred[0].score);
    expect(profile.contractVersion).toBe("interest-profile/v1");
    expect(profile.summary.preferredDifficulty).toBe("MEDIUM");
    expect(profile.summary.preferredPlayModes).toEqual(["STANDARD"]);
  });

  it("caps the inferred entity list at 20 items", () => {
    const profile = computeInterestProfile({
      userId: "user_1",
      explicitInterests: [],
      topicStats: Array.from({ length: 25 }).map((_, index) => ({
        topicId: `topic_${index}`,
        slug: `topic-${index}`,
        name: `Topic ${index}`,
        schemaType: "SPORTS_TEAM" as const,
        questionsAnswered: 1,
        successRate: 50,
        lastAnsweredAt: new Date().toISOString(),
      })),
      searchSignals: [],
      preferences: {
        preferredDifficulty: null,
        preferredPlayModes: [],
      },
    });

    expect(profile.inferred).toHaveLength(20);
  });

  it("does not double-count explicit interests in summary ranking", () => {
    const profile = computeInterestProfile({
      userId: "user_1",
      explicitInterests: [
        {
          topicId: "sport_cricket",
          slug: "cricket",
          name: "Cricket",
          schemaType: "SPORT",
          source: "PROFILE",
          strength: 1,
        },
      ],
      topicStats: [],
      searchSignals: [
        {
          topicId: "sport_football",
          slug: "football",
          name: "Football",
          schemaType: "SPORT",
          timesSearched: 5,
          lastSearchedAt: new Date().toISOString(),
        },
      ],
      preferences: {
        preferredDifficulty: null,
        preferredPlayModes: [],
      },
    });

    expect(profile.summary.topEntities).toEqual(["Cricket", "Football"]);
    expect(profile.summary.topSports).toEqual(["Cricket", "Football"]);
  });
});
