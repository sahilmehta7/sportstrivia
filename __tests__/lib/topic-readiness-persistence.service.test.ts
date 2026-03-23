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

jest.mock("@/lib/db", () => ({
  prisma: {
    topic: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { syncTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.persistence";

describe("syncTopicEntityReadiness", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists READY status when the topic satisfies readiness rules", async () => {
    (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
      id: "team_1",
      schemaType: "SPORTS_TEAM",
      schemaCanonicalUrl: "https://example.com/team",
      schemaEntityData: { teamName: "India" },
      outgoingRelations: [
        {
          fromTopicId: "team_1",
          toTopicId: "sport_1",
          relationType: "BELONGS_TO_SPORT",
        },
      ],
    });
    (prisma.topic.update as jest.Mock).mockResolvedValue({
      id: "team_1",
      entityStatus: "READY",
    });

    const result = await syncTopicEntityReadiness("team_1");

    expect(result.entityStatus).toBe("READY");
    expect(prisma.topic.update).toHaveBeenCalledWith({
      where: { id: "team_1" },
      data: expect.objectContaining({
        entityStatus: "READY",
        entityValidatedAt: expect.any(Date),
      }),
    });
  });

  it("persists NEEDS_REVIEW when the required sport anchor is missing", async () => {
    (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
      id: "team_1",
      schemaType: "SPORTS_TEAM",
      schemaCanonicalUrl: "https://example.com/team",
      schemaEntityData: { teamName: "India" },
      outgoingRelations: [],
    });
    (prisma.topic.update as jest.Mock).mockResolvedValue({
      id: "team_1",
      entityStatus: "NEEDS_REVIEW",
    });

    const result = await syncTopicEntityReadiness("team_1");

    expect(result.entityStatus).toBe("NEEDS_REVIEW");
    expect(prisma.topic.update).toHaveBeenCalledWith({
      where: { id: "team_1" },
      data: expect.objectContaining({
        entityStatus: "NEEDS_REVIEW",
        entityValidatedAt: null,
      }),
    });
  });
});
