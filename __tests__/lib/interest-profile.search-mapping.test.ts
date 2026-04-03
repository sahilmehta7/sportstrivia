/** @jest-environment node */

import { SearchContext } from "@prisma/client";

var prismaMock: {
  userInterestPreference: { findMany: jest.Mock };
  userTopicStats: { findMany: jest.Mock };
  userSearchQuery: { findMany: jest.Mock };
  userDiscoveryPreference: { findUnique: jest.Mock };
  topic: { findMany: jest.Mock };
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    userInterestPreference: { findMany: jest.fn() },
    userTopicStats: { findMany: jest.fn() },
    userSearchQuery: { findMany: jest.fn() },
    userDiscoveryPreference: { findUnique: jest.fn() },
    topic: { findMany: jest.fn() },
  };

  return { prisma: prismaMock };
});

import {
  clearInterestProfileCache,
  getInterestProfileForUser,
} from "@/lib/services/interest-profile.service";

describe("interest-profile search mapping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearInterestProfileCache();

    prismaMock.userInterestPreference.findMany.mockResolvedValue([]);
    prismaMock.userTopicStats.findMany.mockResolvedValue([]);
    prismaMock.userDiscoveryPreference.findUnique.mockResolvedValue(null);
  });

  it("maps topic searches using batched topic lookups", async () => {
    prismaMock.userSearchQuery.findMany.mockResolvedValue([
      {
        timesSearched: 3,
        lastSearchedAt: new Date("2026-03-20T00:00:00.000Z"),
        searchQuery: {
          query: "cricket",
          context: SearchContext.TOPIC,
        },
      },
      {
        timesSearched: 2,
        lastSearchedAt: new Date("2026-03-21T00:00:00.000Z"),
        searchQuery: {
          query: "india",
          context: SearchContext.TOPIC,
        },
      },
    ]);

    prismaMock.topic.findMany
      .mockResolvedValueOnce([
        {
          id: "sport_cricket",
          slug: "cricket",
          name: "Cricket",
          schemaType: "SPORT",
          alternateNames: [],
          indexEligible: true,
          updatedAt: new Date("2026-03-25T00:00:00.000Z"),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "team_india",
          slug: "india-cricket-team",
          name: "India",
          schemaType: "SPORTS_TEAM",
        },
      ]);

    const profile = await getInterestProfileForUser("user_1");

    expect(prismaMock.topic.findMany).toHaveBeenCalledTimes(2);
    expect(profile.inferred.length).toBeGreaterThan(0);
  });
});
