/** @jest-environment node */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
      ...init,
    }),
  },
  NextRequest: class {},
}));

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));

var prismaMock: {
  userInterestPreference: {
    findMany: jest.Mock;
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
  userFollowedTopic: {
    findMany: jest.Mock;
    upsert: jest.Mock;
    deleteMany: jest.Mock;
  };
  userDiscoveryPreference: {
    upsert: jest.Mock;
    findUnique: jest.Mock;
  };
  userTopicStats: {
    findMany: jest.Mock;
  };
  userSearchQuery: {
    findMany: jest.Mock;
  };
  topic: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    userInterestPreference: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    userFollowedTopic: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    userDiscoveryPreference: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    userTopicStats: {
      findMany: jest.fn(),
    },
    userSearchQuery: {
      findMany: jest.fn(),
    },
    topic: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return { prisma: prismaMock };
});

import { requireAuth } from "@/lib/auth-helpers";
import { GET as getInterests, PUT as putInterests } from "@/app/api/users/me/interests/route";
import { GET as getFollows } from "@/app/api/users/me/follows/route";
import { GET as getInterestProfile } from "@/app/api/users/me/interest-profile/route";
import { POST as followTopic, DELETE as unfollowTopic } from "@/app/api/topics/[id]/follow/route";

describe("user interests and follows routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({ id: "user_1", role: "USER" });
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
  });

  it("replaces explicit interests and updates discovery preferences", async () => {
    prismaMock.topic.findMany.mockResolvedValue([
      {
        id: "sport_cricket",
        schemaType: "SPORT",
      },
    ]);
    prismaMock.userDiscoveryPreference.upsert.mockResolvedValue({
      userId: "user_1",
      preferredDifficulty: "MEDIUM",
      preferredPlayModes: ["STANDARD"],
    });

    const request = new Request("http://localhost/api/users/me/interests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interests: [
          {
            topicId: "sport_cricket",
            source: "ONBOARDING",
            strength: 1,
          },
        ],
        preferences: {
          preferredDifficulty: "MEDIUM",
          preferredPlayModes: ["STANDARD"],
        },
      }),
    });

    const response = await putInterests(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.userInterestPreference.deleteMany).toHaveBeenCalled();
    expect(prismaMock.userInterestPreference.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user_1",
          topicId: "sport_cricket",
          source: "PROFILE",
          strength: 1,
        },
      ],
    });
    expect(prismaMock.userDiscoveryPreference.upsert).toHaveBeenCalled();
    expect(body.data.savedInterests).toEqual([
      expect.objectContaining({
        topicId: "sport_cricket",
        source: "PROFILE",
      }),
    ]);
    expect(body.data.droppedTopicIds).toEqual([]);
  });

  it("returns explicit interests and discovery preferences", async () => {
    prismaMock.userInterestPreference.findMany.mockResolvedValue([
      {
        topicId: "sport_cricket",
        source: "ONBOARDING",
        strength: 1,
        topic: {
          id: "sport_cricket",
          name: "Cricket",
          slug: "cricket",
          schemaType: "SPORT",
        },
      },
    ]);
    prismaMock.userDiscoveryPreference.findUnique.mockResolvedValue({
      preferredDifficulty: "MEDIUM",
      preferredPlayModes: ["STANDARD"],
    });

    const response = await getInterests();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.interests).toHaveLength(1);
    expect(body.data.preferences.preferredDifficulty).toBe("MEDIUM");
  });

  it("returns followed topics", async () => {
    prismaMock.userFollowedTopic.findMany.mockResolvedValue([
      {
        topic: {
          id: "team_india",
          name: "India",
          slug: "india-cricket-team",
          schemaType: "SPORTS_TEAM",
        },
      },
    ]);

    const response = await getFollows();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.follows[0].topic.slug).toBe("india-cricket-team");
  });

  it("returns a merged interest profile", async () => {
    prismaMock.userInterestPreference.findMany.mockResolvedValue([
      {
        source: "ONBOARDING",
        strength: 1,
        topic: {
          id: "sport_cricket",
          name: "Cricket",
          slug: "cricket",
          schemaType: "SPORT",
        },
      },
    ]);
    prismaMock.userFollowedTopic.findMany.mockResolvedValue([
      {
        topic: {
          id: "team_india",
          name: "India",
          slug: "india-cricket-team",
          schemaType: "SPORTS_TEAM",
        },
      },
    ]);
    prismaMock.userTopicStats.findMany.mockResolvedValue([]);
    prismaMock.userSearchQuery.findMany.mockResolvedValue([
      {
        searchQueryId: "search_query_1",
        lastSearchedAt: new Date("2026-03-20T00:00:00.000Z"),
        timesSearched: 4,
        searchQuery: {
          query: "mystery string",
          context: "TOPIC",
        },
      },
    ]);
    prismaMock.userDiscoveryPreference.findUnique.mockResolvedValue({
      preferredDifficulty: "MEDIUM",
      preferredPlayModes: ["STANDARD"],
    });

    const response = await getInterestProfile();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.summary.topEntities[0]).toBe("India");
    expect(body.data.inferred).toEqual([]);
  });

  it("drops invalid and non-followable interests and forces PROFILE source", async () => {
    prismaMock.topic.findMany.mockResolvedValue([
      {
        id: "sport_cricket",
        schemaType: "SPORT",
      },
    ]);
    prismaMock.userDiscoveryPreference.upsert.mockResolvedValue({
      userId: "user_1",
      preferredDifficulty: null,
      preferredPlayModes: [],
    });

    const request = new Request("http://localhost/api/users/me/interests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interests: [
          { topicId: "sport_cricket", source: "ADMIN", strength: 0.9 },
          { topicId: "topic_freeform", source: "PROFILE", strength: 0.8 },
          { topicId: "missing_topic", source: "PROFILE", strength: 0.7 },
        ],
        preferences: {
          preferredDifficulty: null,
          preferredPlayModes: [],
        },
      }),
    });

    const response = await putInterests(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.userInterestPreference.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user_1",
          topicId: "sport_cricket",
          source: "PROFILE",
          strength: 0.9,
        },
      ],
    });
    expect(body.data.droppedTopicIds).toEqual(["topic_freeform", "missing_topic"]);
  });

  it("follows a typed topic idempotently", async () => {
    prismaMock.topic.findUnique.mockResolvedValue({
      id: "team_india",
      schemaType: "SPORTS_TEAM",
      slug: "india-cricket-team",
      name: "India",
    });
    prismaMock.userFollowedTopic.upsert.mockResolvedValue({
      id: "follow_1",
      userId: "user_1",
      topicId: "team_india",
    });

    const response = await followTopic({} as any, {
      params: Promise.resolve({ id: "team_india" }),
    });

    expect(response.status).toBe(200);
    expect(prismaMock.userFollowedTopic.upsert).toHaveBeenCalledWith({
      where: {
        userId_topicId: {
          userId: "user_1",
          topicId: "team_india",
        },
      },
      update: {},
      create: {
        userId: "user_1",
        topicId: "team_india",
      },
    });
  });

  it("rejects follows for non-followable topics", async () => {
    prismaMock.topic.findUnique.mockResolvedValue({
      id: "topic_misc",
      schemaType: "NONE",
      slug: "misc",
      name: "Misc",
    });

    const response = await followTopic({} as any, {
      params: Promise.resolve({ id: "topic_misc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/not followable/i);
  });

  it("unfollows a topic", async () => {
    prismaMock.userFollowedTopic.deleteMany.mockResolvedValue({ count: 1 });

    const response = await unfollowTopic({} as any, {
      params: Promise.resolve({ id: "team_india" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toContain("Unfollowed");
  });
});
