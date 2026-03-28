jest.mock("@/lib/db", () => ({
  prisma: {
    topicSourceDocument: {
      findMany: jest.fn(),
    },
    topicClaim: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { normalizeTopicSourceDocuments } from "@/lib/services/topic-content/normalize.service";

describe("topic content normalize duplicate winner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates the existing winner when a duplicate claim has higher confidence", async () => {
    (prisma.topicSourceDocument.findMany as jest.Mock).mockResolvedValue([
      {
        id: "doc_low",
        topicId: "topic_1",
        isCommercialSafe: false,
        rawPayload: { description: "Lionel Messi won multiple Ballon d'Or awards." },
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "doc_high",
        topicId: "topic_1",
        isCommercialSafe: true,
        rawPayload: { description: "Lionel Messi won multiple Ballon d'Or awards." },
        createdAt: new Date("2025-12-31T00:00:00.000Z"),
      },
    ]);

    (prisma.topicClaim.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.topicClaim.create as jest.Mock).mockResolvedValue({
      id: "claim_1",
    });
    (prisma.topicClaim.update as jest.Mock).mockResolvedValue({
      id: "claim_1",
    });

    const result = await normalizeTopicSourceDocuments("topic_1");

    expect(prisma.topicClaim.create).toHaveBeenCalledTimes(1);
    expect(prisma.topicClaim.update).toHaveBeenCalledTimes(1);
    expect(prisma.topicClaim.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "claim_1" },
        data: expect.objectContaining({
          sourceDocumentId: "doc_high",
        }),
      })
    );
    expect(result.inserted).toBe(1);
  });
});
