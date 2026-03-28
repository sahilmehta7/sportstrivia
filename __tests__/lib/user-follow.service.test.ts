/** @jest-environment node */

var prismaMock: {
  topic: { findUnique: jest.Mock };
  userFollowedTopic: { upsert: jest.Mock; deleteMany: jest.Mock; findMany: jest.Mock };
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    topic: { findUnique: jest.fn() },
    userFollowedTopic: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  return { prisma: prismaMock };
});

import { followTopicForUser, listFollowedTopicsForUser, unfollowTopicForUser } from "@/lib/services/user-follow.service";

describe("user-follow.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("follows a typed topic idempotently", async () => {
    prismaMock.topic.findUnique.mockResolvedValue({
      id: "team_india",
      slug: "india-cricket-team",
      name: "India",
      schemaType: "SPORTS_TEAM",
      entityStatus: "READY",
    });

    const result = await followTopicForUser("user_1", "team_india");

    expect(prismaMock.userFollowedTopic.upsert).toHaveBeenCalled();
    expect(result).toEqual({ following: true, topicId: "team_india" });
  });

  it("unfollows a topic safely", async () => {
    prismaMock.userFollowedTopic.deleteMany.mockResolvedValue({ count: 0 });

    const result = await unfollowTopicForUser("user_1", "team_india");

    expect(prismaMock.userFollowedTopic.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1", topicId: "team_india" },
    });
    expect(result).toEqual({ following: false, topicId: "team_india" });
  });

  it("groups followed topics by schema type", async () => {
    prismaMock.userFollowedTopic.findMany.mockResolvedValue([
      {
        topic: {
          id: "team_india",
          name: "India",
          slug: "india-cricket-team",
          schemaType: "SPORTS_TEAM",
          entityStatus: "READY",
        },
      },
      {
        topic: {
          id: "sport_cricket",
          name: "Cricket",
          slug: "cricket",
          schemaType: "SPORT",
          entityStatus: "READY",
        },
      },
    ]);

    const result = await listFollowedTopicsForUser("user_1");

    expect(result.grouped.teams).toHaveLength(1);
    expect(result.grouped.sports).toHaveLength(1);
  });

  it("rejects non-ready topics", async () => {
    prismaMock.topic.findUnique.mockResolvedValue({
      id: "team_india",
      slug: "india-cricket-team",
      name: "India",
      schemaType: "SPORTS_TEAM",
      entityStatus: "DRAFT",
    });

    await expect(followTopicForUser("user_1", "team_india")).rejects.toThrow(
      /not ready/i
    );
    expect(prismaMock.userFollowedTopic.upsert).not.toHaveBeenCalled();
  });
});
