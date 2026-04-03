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
    upsert: jest.Mock;
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
    findFirst: jest.Mock;
  };
  $transaction: jest.Mock;
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    userInterestPreference: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      upsert: jest.fn(),
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
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return { prisma: prismaMock };
});

import { requireAuth } from "@/lib/auth-helpers";
import { GET as getInterests, PUT as putInterests } from "@/app/api/users/me/interests/route";
import { GET as getInterestProfile } from "@/app/api/users/me/interest-profile/route";
import {
  POST as addInterestTopic,
  DELETE as removeInterestTopic,
} from "@/app/api/users/me/interests/[id]/route";

describe("user interests routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({ id: "user_1", role: "USER" });
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
    prismaMock.topic.findMany.mockResolvedValue([]);
  });

  it("replaces explicit interests and updates discovery preferences", async () => {
    prismaMock.topic.findMany.mockResolvedValue([
      {
        id: "sport_cricket",
        schemaType: "SPORT",
        entityStatus: "READY",
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
    expect(prismaMock.userInterestPreference.upsert).toHaveBeenCalled();
    expect(prismaMock.userInterestPreference.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        topicId: {
          notIn: ["sport_cricket"],
        },
      },
    });
    expect(prismaMock.userDiscoveryPreference.upsert).toHaveBeenCalled();
    expect(body.data.savedInterests).toEqual([
      expect.objectContaining({
        topicId: "sport_cricket",
        source: "ONBOARDING",
      }),
    ]);
    expect(body.data.meta.gateBSignals.validationPolicy).toBe("FOLLOWABLE_AND_READY");
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
          entityStatus: "READY",
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

  it("returns only READY interests in GET response", async () => {
    prismaMock.userInterestPreference.findMany.mockResolvedValue([
      {
        topicId: "sport_cricket",
        source: "PROFILE",
        strength: 1,
        topic: {
          id: "sport_cricket",
          name: "Cricket",
          slug: "cricket",
          schemaType: "SPORT",
          entityStatus: "READY",
        },
      },
      {
        topicId: "team_india",
        source: "PROFILE",
        strength: 1,
        topic: {
          id: "team_india",
          name: "India",
          slug: "india-cricket-team",
          schemaType: "SPORTS_TEAM",
          entityStatus: "DRAFT",
        },
      },
    ]);
    prismaMock.userDiscoveryPreference.findUnique.mockResolvedValue({
      preferredDifficulty: null,
      preferredPlayModes: [],
    });

    const response = await getInterests();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.interests).toHaveLength(1);
    expect(body.data.interests[0].topicId).toBe("sport_cricket");
  });

  it("returns a merged interest profile with derived follows from explicit interests", async () => {
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
    prismaMock.userTopicStats.findMany.mockResolvedValue([]);
    prismaMock.userSearchQuery.findMany.mockResolvedValue([]);
    prismaMock.userDiscoveryPreference.findUnique.mockResolvedValue({
      preferredDifficulty: "MEDIUM",
      preferredPlayModes: ["STANDARD"],
    });

    const response = await getInterestProfile();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.follows).toHaveLength(1);
    expect(body.data.follows[0].topicId).toBe("sport_cricket");
    expect(body.data.contractVersion).toBe("interest-profile/v1");
  });

  it("adds an interest via topic-level mutation endpoint", async () => {
    prismaMock.topic.findUnique.mockResolvedValue({
      id: "team_india",
      schemaType: "SPORTS_TEAM",
      slug: "india-cricket-team",
      name: "India",
      entityStatus: "READY",
    });
    prismaMock.userInterestPreference.upsert.mockResolvedValue({
      id: "interest_1",
      userId: "user_1",
      topicId: "team_india",
    });

    const response = await addInterestTopic({} as any, {
      params: Promise.resolve({ id: "team_india" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.following).toBe(true);
    expect(body.data.topicId).toBe("team_india");
    expect(prismaMock.userInterestPreference.upsert).toHaveBeenCalled();
  });

  it("removes an interest via topic-level mutation endpoint", async () => {
    prismaMock.userInterestPreference.deleteMany.mockResolvedValue({ count: 1 });

    const response = await removeInterestTopic({} as any, {
      params: Promise.resolve({ id: "team_india" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.following).toBe(false);
    expect(body.data.topicId).toBe("team_india");
    expect(prismaMock.userInterestPreference.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        topicId: "team_india",
      },
    });
  });

  it("rejects topic-level mutations for non-followable topics", async () => {
    prismaMock.topic.findUnique.mockResolvedValue({
      id: "topic_misc",
      schemaType: "NONE",
      slug: "misc",
      name: "Misc",
      entityStatus: "READY",
    });

    const response = await addInterestTopic({} as any, {
      params: Promise.resolve({ id: "topic_misc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/not followable/i);
  });
});
