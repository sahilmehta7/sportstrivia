/** @jest-environment node */

var prismaMock: any;

jest.mock("@/lib/db", () => {
  prismaMock = {
    collection: {
      findUnique: jest.fn(),
    },
    topic: {
      findUnique: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

import { NotFoundError } from "@/lib/errors";
import {
  resolveCollectionIdFromPathReference,
  resolveTopicIdFromPathReference,
} from "@/lib/services/route-reference.service";

describe("route reference resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.collection.findUnique.mockReset();
    prismaMock.topic.findUnique.mockReset();
  });

  it("resolves collection by slug before falling back to id", async () => {
    prismaMock.collection.findUnique.mockResolvedValueOnce({ id: "collection_1" });

    await expect(
      resolveCollectionIdFromPathReference("ipl-collection")
    ).resolves.toBe("collection_1");
    expect(prismaMock.collection.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.collection.findUnique).toHaveBeenCalledWith({
      where: { slug: "ipl-collection" },
      select: { id: true },
    });
  });

  it("falls back to collection id when slug is not found", async () => {
    prismaMock.collection.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "collection_1" });

    await expect(
      resolveCollectionIdFromPathReference("collection_1", {
        allowIdFallback: true,
      })
    ).resolves.toBe("collection_1");
    expect(prismaMock.collection.findUnique).toHaveBeenNthCalledWith(1, {
      where: { slug: "collection_1" },
      select: { id: true },
    });
    expect(prismaMock.collection.findUnique).toHaveBeenNthCalledWith(2, {
      where: { id: "collection_1" },
      select: { id: true },
    });
  });

  it("returns not found when neither slug nor id resolve", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(null);

    await expect(
      resolveCollectionIdFromPathReference("unknown-ref", {
        allowIdFallback: true,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("resolves topic by slug only by default", async () => {
    prismaMock.topic.findUnique.mockResolvedValueOnce({ id: "topic_1" });

    await expect(resolveTopicIdFromPathReference("india-cricket-team")).resolves.toBe(
      "topic_1"
    );
    expect(prismaMock.topic.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.topic.findUnique).toHaveBeenCalledWith({
      where: { slug: "india-cricket-team" },
      select: { id: true },
    });
  });
});
