import {
  buildExpandedTopicSeedIds,
  buildDirectFollowQuizItems,
  buildPersonalizationDiagnostics,
  buildRailOrder,
  buildUserPlayStyleProfileFromAttempts,
  getTrendingRailPresentation,
  rankCandidatesWithPlayStyleBoost,
  resolveNearestSportAncestorByTopicIds,
  shouldUseSportScopedTrending,
} from "@/lib/services/personalized-home.service";
import type { PersonalizedHomeRail } from "@/types/personalized-home";

function makeRail(kind: PersonalizedHomeRail["kind"], title: string): PersonalizedHomeRail {
  return {
    kind,
    title,
    items: [
      {
        quizId: `${kind}-1`,
        slug: `${kind.toLowerCase()}-quiz`,
        title: `${title} quiz`,
        coverImageUrl: null,
        difficulty: "MEDIUM",
        estimatedDuration: 5,
        reasonLabel: "reason",
        sourceKind: "INTEREST_PROFILE",
      },
    ],
  };
}

describe("personalized-home presentation helpers", () => {
  it("returns truthful trending presentation metadata", () => {
    expect(getTrendingRailPresentation("SPORT_SCOPED")).toEqual({
      title: "Trending in Your Sports",
      sourceKind: "TRENDING_SPORT",
    });

    expect(getTrendingRailPresentation("PLATFORM")).toEqual({
      title: "Trending Now",
      sourceKind: "TRENDING_PLATFORM",
    });
  });

  it("prioritizes personalized rails over onboarding fallback", () => {
    const becauseRail = makeRail("BECAUSE_YOU_LIKE", "Because You Like");
    const followsRail = makeRail("FROM_YOUR_FOLLOWS", "From Your Follows");
    const relatedRail = makeRail("RELATED_TO_YOUR_FOLLOWS", "Related to Your Follows");
    const trendingRail = makeRail("TRENDING_IN_YOUR_SPORTS", "Trending in Your Sports");

    const rails = buildRailOrder(
      {
        BECAUSE_YOU_LIKE: becauseRail,
        FROM_YOUR_FOLLOWS: followsRail,
        RELATED_TO_YOUR_FOLLOWS: relatedRail,
        TRENDING_IN_YOUR_SPORTS: trendingRail,
      },
      5
    );

    expect(rails.map((rail) => rail.kind)).toEqual([
      "FROM_YOUR_FOLLOWS",
      "RELATED_TO_YOUR_FOLLOWS",
      "BECAUSE_YOU_LIKE",
      "TRENDING_IN_YOUR_SPORTS",
    ]);
  });

  it("uses deterministic priority order and max rail cap", () => {
    const rails = buildRailOrder(
      {
        FROM_YOUR_FOLLOWS: makeRail("FROM_YOUR_FOLLOWS", "From Your Follows"),
        RELATED_TO_YOUR_FOLLOWS: makeRail("RELATED_TO_YOUR_FOLLOWS", "Related to Your Follows"),
        FROM_YOUR_FAVORITE_TEAMS: makeRail("FROM_YOUR_FAVORITE_TEAMS", "From Your Favorite Teams"),
        FROM_YOUR_FAVORITE_ATHLETES: makeRail("FROM_YOUR_FAVORITE_ATHLETES", "From Your Favorite Athletes"),
        BECAUSE_YOU_LIKE: makeRail("BECAUSE_YOU_LIKE", "Because You Like"),
        MORE_FROM_YOUR_TOP_SPORTS: makeRail("MORE_FROM_YOUR_TOP_SPORTS", "More From Your Top Sports"),
        TRENDING_IN_YOUR_SPORTS: makeRail("TRENDING_IN_YOUR_SPORTS", "Trending in Your Sports"),
      },
      5
    );

    expect(rails).toHaveLength(5);
    expect(rails.map((rail) => rail.kind)).toEqual([
      "FROM_YOUR_FOLLOWS",
      "RELATED_TO_YOUR_FOLLOWS",
      "FROM_YOUR_FAVORITE_TEAMS",
      "FROM_YOUR_FAVORITE_ATHLETES",
      "BECAUSE_YOU_LIKE",
    ]);
  });

  it("uses onboarding + trending fallback when personalized rails are missing", () => {
    const onboardingRail = makeRail("ONBOARDING_PICKS", "From Your Onboarding Picks");
    const trendingRail = makeRail("TRENDING_IN_YOUR_SPORTS", "Trending Now");

    const rails = buildRailOrder(
      {
        ONBOARDING_PICKS: onboardingRail,
        TRENDING_IN_YOUR_SPORTS: trendingRail,
      },
      5
    );

    expect(rails.map((rail) => rail.kind)).toEqual([
      "ONBOARDING_PICKS",
      "TRENDING_IN_YOUR_SPORTS",
    ]);
  });

  it("uses sport-scoped trending even for a single top sport when not force-platform", () => {
    expect(shouldUseSportScopedTrending(["Cricket"], false)).toBe(true);
    expect(shouldUseSportScopedTrending([], false)).toBe(false);
    expect(shouldUseSportScopedTrending(["Cricket"], true)).toBe(false);
  });

  it("builds conservative expanded topic seed ids with descendants and sport ancestors", () => {
    const expanded = buildExpandedTopicSeedIds({
      seedTopicIds: ["team-mi", "athlete-a"],
      descendantsByTopicId: new Map([
        ["team-mi", ["team-mi-2020", "team-mi-2021"]],
      ]),
      nearestSportAncestorByTopicId: new Map([
        ["team-mi", "sport-cricket"],
        ["athlete-a", "sport-cricket"],
      ]),
    });

    expect(expanded).toEqual([
      "team-mi",
      "team-mi-2020",
      "team-mi-2021",
      "sport-cricket",
      "athlete-a",
    ]);
  });

  it("builds diagnostics with explicit trend scope reason", () => {
    const diagnostics = buildPersonalizationDiagnostics({
      trendScope: "PLATFORM",
      hasPersonalizedRails: true,
      topSportsCount: 1,
      scopedTrendingCandidateCount: 0,
      sportScopedAttempted: true,
      forcePlatformFallback: false,
      railEligibility: {
        BECAUSE_YOU_LIKE: { status: "HIDDEN", reason: "NO_CANDIDATES" },
        FROM_YOUR_FOLLOWS: { status: "HIDDEN", reason: "NO_CANDIDATES" },
        RELATED_TO_YOUR_FOLLOWS: { status: "HIDDEN", reason: "NO_CANDIDATES" },
        MORE_FROM_YOUR_TOP_SPORTS: { status: "SHOWN" },
        FROM_YOUR_FAVORITE_TEAMS: { status: "HIDDEN", reason: "NO_SEEDS" },
        FROM_YOUR_FAVORITE_ATHLETES: { status: "HIDDEN", reason: "NO_SEEDS" },
        NEW_IN_YOUR_GRAPH: { status: "SHOWN" },
        UNEXPLORED_IN_YOUR_SPORTS: { status: "HIDDEN", reason: "NO_CANDIDATES" },
        ONBOARDING_PICKS: { status: "SHOWN" },
        TRENDING_IN_YOUR_SPORTS: { status: "SHOWN" },
      },
      playStyleBoostEnabled: true,
      playStyleEvidenceCount: 2,
    });

    expect(diagnostics.trendScopeReason).toBe("NO_SCOPED_RESULTS");
    expect(diagnostics.railEligibility.ONBOARDING_PICKS.status).toBe("SHOWN");
    expect(diagnostics.playStyle.status).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("reports forced platform fallback when sport scope is skipped", () => {
    const diagnostics = buildPersonalizationDiagnostics({
      trendScope: "PLATFORM",
      hasPersonalizedRails: false,
      topSportsCount: 2,
      scopedTrendingCandidateCount: 0,
      sportScopedAttempted: false,
      forcePlatformFallback: true,
      railEligibility: {
        BECAUSE_YOU_LIKE: { status: "HIDDEN", reason: "NO_CANDIDATES" },
        FROM_YOUR_FOLLOWS: { status: "HIDDEN", reason: "NO_CANDIDATES" },
        RELATED_TO_YOUR_FOLLOWS: { status: "HIDDEN", reason: "NO_CANDIDATES" },
        MORE_FROM_YOUR_TOP_SPORTS: { status: "HIDDEN", reason: "NO_SEEDS" },
        FROM_YOUR_FAVORITE_TEAMS: { status: "HIDDEN", reason: "NO_SEEDS" },
        FROM_YOUR_FAVORITE_ATHLETES: { status: "HIDDEN", reason: "NO_SEEDS" },
        NEW_IN_YOUR_GRAPH: { status: "HIDDEN", reason: "NO_CANDIDATES" },
        UNEXPLORED_IN_YOUR_SPORTS: { status: "HIDDEN", reason: "NO_SEEDS" },
        ONBOARDING_PICKS: { status: "SHOWN" },
        TRENDING_IN_YOUR_SPORTS: { status: "HIDDEN", reason: "NO_CANDIDATES" },
      },
      playStyleBoostEnabled: false,
      playStyleEvidenceCount: 0,
    });

    expect(diagnostics.trendScopeReason).toBe("FORCED_PLATFORM_FALLBACK");
    expect(diagnostics.railEligibility.TRENDING_IN_YOUR_SPORTS.status).toBe("HIDDEN");
  });

  it("computes play style profile and boosts ranking toward matching candidates", () => {
    const playStyle = buildUserPlayStyleProfileFromAttempts(
      [
        { playMode: "GRID_3X3", recurringType: "DAILY", difficulty: "HARD", duration: 420 },
        { playMode: "GRID_3X3", recurringType: "DAILY", difficulty: "HARD", duration: 450 },
        { playMode: "STANDARD", recurringType: "NONE", difficulty: "MEDIUM", duration: 120 },
      ],
      3
    );

    expect(playStyle).not.toBeNull();
    expect(playStyle?.evidenceCount).toBe(3);

    const ranked = rankCandidatesWithPlayStyleBoost(
      [
        {
          id: "quiz-a",
          slug: "quiz-a",
          title: "Grid Daily Hard",
          difficulty: "HARD",
          duration: 480,
          descriptionImageUrl: null,
          sport: "Cricket",
          playMode: "GRID_3X3",
          recurringType: "DAILY",
          topicConfigs: [],
        },
        {
          id: "quiz-b",
          slug: "quiz-b",
          title: "Standard Easy",
          difficulty: "EASY",
          duration: 90,
          descriptionImageUrl: null,
          sport: "Cricket",
          playMode: "STANDARD",
          recurringType: "NONE",
          topicConfigs: [],
        },
      ],
      playStyle
    );

    expect(ranked[0]?.id).toBe("quiz-a");
  });

  it("keeps follows rail items tied to direct follow topics only", () => {
    const followItems = buildDirectFollowQuizItems(
      [
        {
          id: "quiz-direct",
          slug: "quiz-direct",
          title: "Direct follow match",
          difficulty: "MEDIUM",
          duration: 300,
          descriptionImageUrl: null,
          sport: "Cricket",
          playMode: "STANDARD",
          recurringType: "NONE",
          topicConfigs: [{ topic: { id: "team-mi", name: "Mumbai Indians", slug: "mi" } }],
        },
        {
          id: "quiz-expanded-only",
          slug: "quiz-expanded-only",
          title: "Expanded-only match",
          difficulty: "MEDIUM",
          duration: 300,
          descriptionImageUrl: null,
          sport: "Cricket",
          playMode: "STANDARD",
          recurringType: "NONE",
          topicConfigs: [{ topic: { id: "sport-cricket", name: "Cricket", slug: "cricket" } }],
        },
      ],
      new Map([["team-mi", { name: "Mumbai Indians" }]])
    );

    expect(followItems).toHaveLength(1);
    expect(followItems[0]?.quizId).toBe("quiz-direct");
    expect(followItems[0]?.reasonLabel).toBe("From your follows: Mumbai Indians");
  });

  it("resolves nearest sport ancestor iteratively with bounded lookups", async () => {
    const topicGraph = new Map([
      ["athlete-a", { id: "athlete-a", parentId: "team-a", schemaType: "ATHLETE" }],
      ["team-a", { id: "team-a", parentId: "sport-cricket", schemaType: "SPORTS_TEAM" }],
      ["sport-cricket", { id: "sport-cricket", parentId: null, schemaType: "SPORT" }],
      ["topic-x", { id: "topic-x", parentId: "topic-y", schemaType: "TOPIC" }],
      ["topic-y", { id: "topic-y", parentId: null, schemaType: "TOPIC" }],
    ]);

    const fetchCalls: string[][] = [];
    const result = await resolveNearestSportAncestorByTopicIds(
      ["athlete-a", "topic-x", "missing"],
      async (ids) => {
        fetchCalls.push(ids);
        return ids.map((id) => topicGraph.get(id)).filter((node): node is NonNullable<typeof node> => Boolean(node));
      }
    );

    expect(result.get("athlete-a")).toBe("sport-cricket");
    expect(result.has("topic-x")).toBe(false);
    expect(result.has("missing")).toBe(false);
    expect(fetchCalls.flat()).toContain("athlete-a");
    expect(fetchCalls.flat()).toContain("team-a");
    expect(fetchCalls.flat()).toContain("sport-cricket");
    expect(fetchCalls.flat()).not.toContain("unrelated-topic");
  });
});
