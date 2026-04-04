import type { InterestProfile } from "@/lib/services/interest-profile.service";

jest.mock("@/lib/feature-flags", () => ({
  isPersonalizedHomeDiagnosticsEnabled: jest.fn(() => false),
  isPersonalizedHomePlayStyleBoostEnabled: jest.fn(() => false),
}));

jest.mock("@/lib/services/collection.service", () => ({
  listPublishedCollectionsSafe: jest.fn(async () => ({ collections: [] })),
}));

jest.mock("@/lib/services/daily-game.service", () => ({
  getTodaysGame: jest.fn(async () => null),
}));

jest.mock("@/lib/services/interest-profile.service", () => ({
  getInterestProfileForUser: jest.fn(),
}));

jest.mock("@/lib/services/topic.service", () => ({
  getDescendantTopicIdsForMultiple: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    quizAttempt: { findMany: jest.fn() },
    topic: { findMany: jest.fn() },
    quiz: { findMany: jest.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { getInterestProfileForUser } from "@/lib/services/interest-profile.service";
import { getDescendantTopicIdsForMultiple } from "@/lib/services/topic.service";
import { getPersonalizedHomePayload } from "@/lib/services/personalized-home.service";

type MockQuiz = {
  id: string;
  slug: string;
  title: string;
  topicIds: string[];
  sport?: string | null;
};

const mockUserId = "user_1";
const mockUser = {
  id: mockUserId,
  name: "Sahil",
  currentStreak: 2,
  longestStreak: 9,
};

function makeProfile(overrides?: Partial<InterestProfile>): InterestProfile {
  return {
    contractVersion: "interest-profile/v1",
    userId: mockUserId,
    generatedAt: "2026-04-04T00:00:00.000Z",
    follows: [],
    explicit: [],
    inferred: [],
    preferences: {
      preferredDifficulty: null,
      preferredPlayModes: [],
    },
    summary: {
      topEntities: [],
      topSports: [],
      preferredDifficulty: null,
      preferredPlayModes: [],
    },
    ...overrides,
  };
}

function buildQuizRows(quizzes: MockQuiz[]) {
  return quizzes.map((quiz) => ({
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    difficulty: "MEDIUM",
    duration: 300,
    descriptionImageUrl: null,
    sport: quiz.sport ?? null,
    playMode: "STANDARD",
    recurringType: "NONE",
    topicConfigs: quiz.topicIds.map((topicId) => ({
      topic: {
        id: topicId,
        name: topicId,
        slug: topicId,
      },
    })),
  }));
}

describe("personalized home payload integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.quizAttempt.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.topic.findMany as jest.Mock).mockResolvedValue([]);
  });

  it("keeps RELATED_TO_YOUR_FOLLOWS with descendant attribution labels", async () => {
    (getInterestProfileForUser as jest.Mock).mockResolvedValue(
      makeProfile({
        follows: [
          { topicId: "seed-a", slug: "seed-a", name: "Seed A", schemaType: "SPORTS_TEAM", score: 10 },
          { topicId: "seed-b", slug: "seed-b", name: "Seed B", schemaType: "ATHLETE", score: 10 },
        ],
      })
    );

    (getDescendantTopicIdsForMultiple as jest.Mock).mockResolvedValue(
      new Map<string, string[]>([
        ["seed-a", ["seed-a-child"]],
        ["seed-b", ["seed-b-child"]],
      ])
    );

    const relatedQuizzes = buildQuizRows([
      { id: "q1", slug: "q1", title: "Q1", topicIds: ["seed-a-child"] },
      { id: "q2", slug: "q2", title: "Q2", topicIds: ["seed-b-child"] },
      { id: "q3", slug: "q3", title: "Q3", topicIds: ["seed-a-child"] },
      { id: "q4", slug: "q4", title: "Q4", topicIds: ["seed-a"] },
    ]);

    (prisma.quiz.findMany as jest.Mock).mockImplementation(async (args: { where?: { topicConfigs?: { some?: { topicId?: { in?: string[] } } } } }) => {
      const topicIds = args.where?.topicConfigs?.some?.topicId?.in ?? [];
      if (topicIds.length === 0) return [];
      return relatedQuizzes.filter((quiz) => quiz.topicConfigs.some((config) => topicIds.includes(config.topic.id)));
    });

    const payload = await getPersonalizedHomePayload(mockUserId, new Date("2026-04-04T00:00:00.000Z"));
    const relatedRail = payload.rails.find((rail) => rail.kind === "RELATED_TO_YOUR_FOLLOWS");

    expect(relatedRail).toBeDefined();
    expect(relatedRail?.items).toHaveLength(3);
    expect(relatedRail?.items.map((item) => item.reasonLabel)).toEqual(
      expect.arrayContaining([
        "Related to your follows: Seed A",
        "Related to your follows: Seed B",
      ])
    );
  });

  it("uses only direct follows as team/athlete seeds while supporting descendant matches", async () => {
    (getInterestProfileForUser as jest.Mock).mockResolvedValue(
      makeProfile({
        follows: [
          { topicId: "team-follow", slug: "team-follow", name: "Team Follow", schemaType: "SPORTS_TEAM", score: 10 },
          { topicId: "athlete-follow", slug: "athlete-follow", name: "Athlete Follow", schemaType: "ATHLETE", score: 10 },
        ],
        inferred: [
          { topicId: "team-inferred", slug: "team-inferred", name: "Team Inferred", schemaType: "SPORTS_TEAM", score: 95 },
          { topicId: "athlete-inferred", slug: "athlete-inferred", name: "Athlete Inferred", schemaType: "ATHLETE", score: 95 },
        ],
      })
    );

    (getDescendantTopicIdsForMultiple as jest.Mock).mockResolvedValue(
      new Map<string, string[]>([
        ["team-follow", ["team-follow-child"]],
        ["athlete-follow", ["athlete-follow-child"]],
        ["team-inferred", ["team-inferred-child"]],
        ["athlete-inferred", ["athlete-inferred-child"]],
      ])
    );

    const quizzes = buildQuizRows([
      { id: "qt1", slug: "qt1", title: "Team Follow Quiz 1", topicIds: ["team-follow-child"] },
      { id: "qt2", slug: "qt2", title: "Team Follow Quiz 2", topicIds: ["team-follow-child"] },
      { id: "qt3", slug: "qt3", title: "Team Follow Quiz 3", topicIds: ["team-follow-child"] },
      { id: "qi1", slug: "qi1", title: "Team Inferred Quiz", topicIds: ["team-inferred-child"] },
      { id: "qa1", slug: "qa1", title: "Athlete Follow Quiz 1", topicIds: ["athlete-follow-child"] },
      { id: "qa2", slug: "qa2", title: "Athlete Follow Quiz 2", topicIds: ["athlete-follow-child"] },
      { id: "qa3", slug: "qa3", title: "Athlete Follow Quiz 3", topicIds: ["athlete-follow-child"] },
      { id: "qb1", slug: "qb1", title: "Athlete Inferred Quiz", topicIds: ["athlete-inferred-child"] },
    ]);

    (prisma.quiz.findMany as jest.Mock).mockImplementation(async (args: { where?: { topicConfigs?: { some?: { topicId?: { in?: string[] } } } } }) => {
      const topicIds = args.where?.topicConfigs?.some?.topicId?.in ?? [];
      if (topicIds.length === 0) return [];

      const hasBothFollowFamilies = topicIds.includes("team-follow-child") && topicIds.includes("athlete-follow-child");
      if (hasBothFollowFamilies) {
        return [];
      }

      return quizzes.filter((quiz) => quiz.topicConfigs.some((config) => topicIds.includes(config.topic.id)));
    });

    const payload = await getPersonalizedHomePayload(mockUserId, new Date("2026-04-04T00:00:00.000Z"));
    const teamRail = payload.rails.find((rail) => rail.kind === "FROM_YOUR_FAVORITE_TEAMS");
    const athleteRail = payload.rails.find((rail) => rail.kind === "FROM_YOUR_FAVORITE_ATHLETES");

    expect(teamRail).toBeDefined();
    expect(teamRail?.items.map((item) => item.reasonLabel)).toEqual(
      expect.arrayContaining(["From teams you follow: Team Follow"])
    );
    expect(teamRail?.items.some((item) => item.reasonLabel.includes("Team Inferred"))).toBe(false);

    expect(athleteRail).toBeDefined();
    expect(athleteRail?.items.map((item) => item.reasonLabel)).toEqual(
      expect.arrayContaining(["From athletes you follow: Athlete Follow"])
    );
    expect(athleteRail?.items.some((item) => item.reasonLabel.includes("Athlete Inferred"))).toBe(false);
  });

  it("keeps personalized coverage for inferred-only users when thresholded effective topics are empty", async () => {
    (getInterestProfileForUser as jest.Mock).mockResolvedValue(
      makeProfile({
        inferred: [
          { topicId: "inferred-a", slug: "inferred-a", name: "Inferred A", schemaType: "SPORT", score: 40 },
        ],
      })
    );

    (getDescendantTopicIdsForMultiple as jest.Mock).mockResolvedValue(
      new Map<string, string[]>([
        ["inferred-a", ["inferred-a-child"]],
      ])
    );

    const inferredQuizzes = buildQuizRows([
      { id: "iq1", slug: "iq1", title: "Inferred Quiz 1", topicIds: ["inferred-a-child"] },
      { id: "iq2", slug: "iq2", title: "Inferred Quiz 2", topicIds: ["inferred-a-child"] },
      { id: "iq3", slug: "iq3", title: "Inferred Quiz 3", topicIds: ["inferred-a-child"] },
    ]);

    (prisma.quiz.findMany as jest.Mock).mockImplementation(async (args: { where?: { topicConfigs?: { some?: { topicId?: { in?: string[] } } } } }) => {
      const topicIds = args.where?.topicConfigs?.some?.topicId?.in ?? [];
      if (topicIds.length === 0) return [];
      return inferredQuizzes.filter((quiz) => quiz.topicConfigs.some((config) => topicIds.includes(config.topic.id)));
    });

    const payload = await getPersonalizedHomePayload(mockUserId, new Date("2026-04-04T00:00:00.000Z"));
    const personalizedNonTrending = payload.rails.filter(
      (rail) => rail.kind !== "TRENDING_IN_YOUR_SPORTS" && rail.kind !== "ONBOARDING_PICKS"
    );

    expect(personalizedNonTrending.length).toBeGreaterThan(0);
  });
});
