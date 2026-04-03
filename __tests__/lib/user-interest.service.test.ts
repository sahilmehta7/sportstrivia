/** @jest-environment node */

var prismaMock: {
  topic: { findMany: jest.Mock };
  userInterestPreference: { deleteMany: jest.Mock; createMany: jest.Mock; findMany: jest.Mock; upsert: jest.Mock };
  userDiscoveryPreference: { upsert: jest.Mock; findUnique: jest.Mock };
  $transaction: jest.Mock;
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    topic: { findMany: jest.fn() },
    userInterestPreference: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    userDiscoveryPreference: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return { prisma: prismaMock };
});

import { replaceUserInterestsBySource } from "@/lib/services/user-interest.service";

describe("user-interest.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
  });

  it("replaces interests across all sources and upserts preferences", async () => {
    prismaMock.topic.findMany.mockResolvedValue([
      { id: "sport_cricket", schemaType: "SPORT", entityStatus: "READY" },
      { id: "team_india", schemaType: "SPORTS_TEAM", entityStatus: "READY" },
    ]);

    const result = await replaceUserInterestsBySource({
      userId: "user_1",
      topicIds: ["sport_cricket", "team_india"],
      source: "PROFILE",
      preferences: {
        preferredDifficulty: "MEDIUM",
        preferredPlayModes: ["STANDARD"],
      },
    });

    expect(prismaMock.userInterestPreference.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1", topicId: { notIn: ["sport_cricket", "team_india"] } },
    });
    expect(prismaMock.userInterestPreference.upsert).toHaveBeenCalledTimes(2);
    expect(prismaMock.userDiscoveryPreference.upsert).toHaveBeenCalled();
    expect(result.droppedTopicIds).toEqual([]);
  });

  it("throws error for non-followable topics", async () => {
    prismaMock.topic.findMany.mockResolvedValue([{ id: "topic_misc", schemaType: "NONE", entityStatus: "READY" }]);

    await expect(
      replaceUserInterestsBySource({
        userId: "user_1",
        topicIds: ["topic_misc", "missing"],
        source: "ONBOARDING",
        preferences: {
          preferredDifficulty: null,
          preferredPlayModes: [],
        },
      })
    ).rejects.toThrow("One or more topics are not eligible for interests");
  });

  it("takes over a topic from another source without unique-key collisions", async () => {
    prismaMock.topic.findMany.mockResolvedValue([{ id: "sport_cricket", schemaType: "SPORT", entityStatus: "READY" }]);

    await expect(
      replaceUserInterestsBySource({
        userId: "user_1",
        topicIds: ["sport_cricket"],
        source: "PROFILE",
        preferences: {
          preferredDifficulty: null,
          preferredPlayModes: [],
        },
      })
    ).resolves.toEqual(
      expect.objectContaining({
        savedInterests: [
          {
            userId: "user_1",
            topicId: "sport_cricket",
            source: "PROFILE",
            strength: 1,
          },
        ],
      })
    );

    expect(prismaMock.userInterestPreference.upsert).toHaveBeenCalledWith({
      where: {
        userId_topicId: {
          userId: "user_1",
          topicId: "sport_cricket",
        },
      },
      update: {
        source: "PROFILE",
        strength: 1,
      },
      create: {
        userId: "user_1",
        topicId: "sport_cricket",
        source: "PROFILE",
        strength: 1,
      },
    });
  });
});
