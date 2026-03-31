/** @jest-environment node */

var prismaMock: any;

jest.mock("@/lib/db", () => {
  prismaMock = {
    $transaction: jest.fn(),
    collection: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    topic: {
      findUnique: jest.fn(),
    },
    collectionQuiz: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    quizAttempt: {
      findMany: jest.fn(),
    },
    userCollectionProgress: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  return { prisma: prismaMock };
});

jest.mock("@/lib/services/slug.service", () => ({
  generateUniqueSlug: jest.fn(),
}));

import {
  createCollection,
  listPublishedCollectionsSafe,
  listUserInProgressCollectionsSafe,
  reorderCollectionQuizzes,
  startOrResumeCollection,
} from "@/lib/services/collection.service";
import { BadRequestError } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/services/slug.service";

describe("collection service hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects invalid primary topic anchor when topic is not READY", async () => {
    (generateUniqueSlug as jest.Mock).mockResolvedValue("collection-slug");

    const tx = {
      topic: {
        findUnique: jest.fn().mockResolvedValue({
          id: "topic_1",
          schemaType: "SPORT",
          entityStatus: "DRAFT",
        }),
      },
      collection: {
        create: jest.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

    await expect(
      createCollection({
        name: "Test Collection",
        primaryTopicId: "topic_1",
      })
    ).rejects.toThrow(BadRequestError);

    expect(tx.collection.create).not.toHaveBeenCalled();
  });

  it("rejects reorder payload that does not include all members", async () => {
    const tx = {
      collection: {
        findUnique: jest.fn().mockResolvedValue({
          id: "collection_1",
          quizzes: [{ quizId: "quiz_1" }, { quizId: "quiz_2" }],
        }),
      },
      collectionQuiz: {
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

    await expect(
      reorderCollectionQuizzes("collection_1", [{ quizId: "quiz_1", order: 1 }])
    ).rejects.toThrow(/include all quizzes/i);

    expect(tx.collectionQuiz.update).not.toHaveBeenCalled();
  });

  it("fails start-or-resume when collection has no playable quizzes", async () => {
    prismaMock.collection.findUnique.mockResolvedValue({
      id: "collection_1",
      status: "PUBLISHED",
      quizzes: [],
    });

    await expect(startOrResumeCollection("user_1", "collection_1")).rejects.toThrow(
      /no playable quizzes/i
    );
  });

  it("returns empty published collections payload on recoverable table-missing errors", async () => {
    prismaMock.collection.findMany.mockRejectedValue({ code: "P2021" });
    prismaMock.collection.count.mockRejectedValue({ code: "P2021" });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await listPublishedCollectionsSafe(
      { page: 1, limit: 6, featured: true },
      "quizzes/featured-collections-section"
    );

    expect(result.collections).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(spy).toHaveBeenCalledWith(
      "[collections:fail-open]",
      expect.objectContaining({
        context: "quizzes/featured-collections-section",
        code: "P2021",
      })
    );
    spy.mockRestore();
  });

  it("returns empty in-progress collection list on recoverable errors", async () => {
    prismaMock.userCollectionProgress.findMany.mockRejectedValue({ code: "P2021" });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await listUserInProgressCollectionsSafe(
      "user_1",
      "quizzes/continue-collections-section"
    );

    expect(result).toEqual([]);
    expect(spy).toHaveBeenCalledWith(
      "[collections:fail-open]",
      expect.objectContaining({
        context: "quizzes/continue-collections-section",
        code: "P2021",
      })
    );
    spy.mockRestore();
  });
});
