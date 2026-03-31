import "server-only";

import { prisma } from "@/lib/db";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/lib/errors";
import {
  CollectionStatus,
  CollectionType,
  Prisma,
} from "@prisma/client";
import { generateUniqueSlug } from "@/lib/services/slug.service";
import { isFollowableTopicSchemaType } from "@/lib/topic-followability";

type CollectionQuizWithSummary = {
  quizId: string;
  order: number;
  quiz: {
    id: string;
    slug: string;
    title: string;
    difficulty: string;
    sport: string | null;
    descriptionImageUrl: string | null;
  };
};

const PLAYABLE_QUIZ_FILTER = {
  isPublished: true,
  status: "PUBLISHED" as const,
};

const COLLECTION_FAIL_OPEN_CODES = new Set([
  "P2021", // table missing
  "P2022", // column missing
  "P1001", // db unavailable
  "P1002", // timeout
  "P1008", // operation timeout
  "P1017", // server closed connection
]);

export type PublicCollectionListFilters = {
  page?: number;
  limit?: number;
  type?: CollectionType;
  topicId?: string;
  featured?: boolean;
};

function getPrismaLikeErrorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

export function isCollectionFailOpenError(error: unknown): boolean {
  const code = getPrismaLikeErrorCode(error);
  return Boolean(code && COLLECTION_FAIL_OPEN_CODES.has(code));
}

function logCollectionFailOpen(context: string, error: unknown) {
  const code = getPrismaLikeErrorCode(error);
  console.error("[collections:fail-open]", {
    context,
    code,
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : String(error),
  });
}

function parsePagination(input: { page?: number; limit?: number }) {
  const page = input.page && input.page > 0 ? input.page : 1;
  const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 50) : 12;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function assertContiguousOrdering(items: Array<{ order: number }>) {
  if (items.length === 0) return;

  const sorted = [...items].sort((a, b) => a.order - b.order);
  for (let index = 0; index < sorted.length; index += 1) {
    const expected = index + 1;
    if (sorted[index].order !== expected) {
      throw new BadRequestError(
        "Collection quiz order must be contiguous and start at 1"
      );
    }
  }
}

async function assertPublishedMembershipConstraints(
  tx: Prisma.TransactionClient,
  input: {
    status: CollectionStatus;
    membershipQuizIds: string[];
  }
) {
  if (input.status !== "PUBLISHED" || input.membershipQuizIds.length === 0) return;

  const invalidMemberships = await tx.quiz.findMany({
    where: {
      id: { in: input.membershipQuizIds },
      OR: [{ isPublished: false }, { status: { not: "PUBLISHED" } }],
    },
    select: { id: true },
  });

  if (invalidMemberships.length > 0) {
    throw new BadRequestError(
      "Published collections can only contain published quizzes"
    );
  }
}

async function validateCollectionAnchorTopicId(
  tx: Prisma.TransactionClient,
  primaryTopicId: string | null
) {
  if (!primaryTopicId) return;

  const topic = await tx.topic.findUnique({
    where: { id: primaryTopicId },
    select: {
      id: true,
      schemaType: true,
      entityStatus: true,
    },
  });

  if (!topic) {
    throw new BadRequestError("Primary topic anchor does not exist");
  }
  if (topic.entityStatus !== "READY") {
    throw new BadRequestError("Primary topic anchor must be READY");
  }
  if (!isFollowableTopicSchemaType(topic.schemaType)) {
    throw new BadRequestError("Primary topic anchor type is not supported");
  }
}

export async function listAdminCollections(input: {
  page?: number;
  limit?: number;
  status?: CollectionStatus;
  type?: CollectionType;
  search?: string;
}) {
  const { page, limit, skip } = parsePagination(input);

  const where: Prisma.CollectionWhereInput = {};
  if (input.status) where.status = input.status;
  if (input.type) where.type = input.type;
  if (input.search) {
    where.OR = [
      { name: { contains: input.search, mode: "insensitive" } },
      { slug: { contains: input.search, mode: "insensitive" } },
      { description: { contains: input.search, mode: "insensitive" } },
    ];
  }

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: limit,
      include: {
        primaryTopic: {
          select: {
            id: true,
            name: true,
            slug: true,
            schemaType: true,
            entityStatus: true,
          },
        },
        _count: {
          select: {
            quizzes: true,
            userProgress: true,
          },
        },
      },
    }),
    prisma.collection.count({ where }),
  ]);

  return {
    collections,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: skip + collections.length < total,
      hasPrevious: page > 1,
    },
  };
}

export async function createCollection(input: {
  name: string;
  slug?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: CollectionStatus;
  type?: CollectionType;
  isFeatured?: boolean;
  primaryTopicId?: string | null;
  rulesJson?: Prisma.InputJsonValue | null;
}) {
  const slug = await generateUniqueSlug(input.slug || input.name, "collection");
  const status = input.status ?? CollectionStatus.DRAFT;
  const type = input.type ?? CollectionType.EDITORIAL;

  return prisma.$transaction(async (tx) => {
    const primaryTopicId = input.primaryTopicId ?? null;
    await validateCollectionAnchorTopicId(tx, primaryTopicId);

    return tx.collection.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        status,
        type,
        isFeatured: input.isFeatured ?? false,
        primaryTopicId,
        rulesJson: input.rulesJson ?? undefined,
      },
      include: {
        primaryTopic: {
          select: {
            id: true,
            name: true,
            slug: true,
            schemaType: true,
          },
        },
        _count: {
          select: {
            quizzes: true,
            userProgress: true,
          },
        },
      },
    });
  });
}

export async function updateCollection(
  collectionId: string,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
    coverImageUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    status?: CollectionStatus;
    type?: CollectionType;
    isFeatured?: boolean;
    primaryTopicId?: string | null;
    rulesJson?: Prisma.InputJsonValue | null;
  }
) {
  const existing = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      quizzes: {
        select: { quizId: true },
      },
    },
  });

  if (!existing) {
    throw new NotFoundError("Collection not found");
  }

  const nextSlug =
    input.slug && input.slug !== existing.slug
      ? await generateUniqueSlug(input.slug, "collection", existing.slug)
      : undefined;

  return prisma.$transaction(async (tx) => {
    const nextStatus = input.status ?? existing.status;
    const nextPrimaryTopicId =
      input.primaryTopicId !== undefined ? input.primaryTopicId : existing.primaryTopicId;

    await validateCollectionAnchorTopicId(tx, nextPrimaryTopicId ?? null);

    await assertPublishedMembershipConstraints(tx, {
      status: nextStatus,
      membershipQuizIds: existing.quizzes.map((entry) => entry.quizId),
    });

    const data = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.coverImageUrl !== undefined
        ? { coverImageUrl: input.coverImageUrl }
        : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined
        ? { seoDescription: input.seoDescription }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.isFeatured !== undefined
        ? { isFeatured: input.isFeatured }
        : {}),
      ...(input.primaryTopicId !== undefined
        ? { primaryTopicId: input.primaryTopicId }
        : {}),
      ...(input.rulesJson !== undefined ? { rulesJson: input.rulesJson } : {}),
    };

    return tx.collection.update({
      where: { id: collectionId },
      data: data as Prisma.CollectionUncheckedUpdateInput,
      include: {
        primaryTopic: {
          select: {
            id: true,
            name: true,
            slug: true,
            schemaType: true,
            entityStatus: true,
          },
        },
        _count: {
          select: {
            quizzes: true,
            userProgress: true,
          },
        },
      },
    });
  });
}

export async function addQuizToCollection(
  collectionId: string,
  input: {
    quizId: string;
    order?: number;
  }
) {
  return prisma.$transaction(async (tx) => {
    const [collection, quiz] = await Promise.all([
      tx.collection.findUnique({
        where: { id: collectionId },
        include: {
          quizzes: {
            select: { order: true, quizId: true },
            orderBy: { order: "asc" },
          },
        },
      }),
      tx.quiz.findUnique({
        where: { id: input.quizId },
        select: { id: true, isPublished: true, status: true },
      }),
    ]);

    if (!collection) throw new NotFoundError("Collection not found");
    if (!quiz) throw new NotFoundError("Quiz not found");

    if (
      collection.status === "PUBLISHED" &&
      (!quiz.isPublished || quiz.status !== "PUBLISHED")
    ) {
      throw new BadRequestError(
        "Published collections can only contain published quizzes"
      );
    }

    if (collection.quizzes.some((item) => item.quizId === input.quizId)) {
      throw new ConflictError("Quiz is already in this collection");
    }

    const targetOrder =
      input.order && input.order > 0
        ? Math.min(input.order, collection.quizzes.length + 1)
        : collection.quizzes.length + 1;

    if (targetOrder <= collection.quizzes.length) {
      await tx.collectionQuiz.updateMany({
        where: {
          collectionId,
          order: {
            gte: targetOrder,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      });
    }

    return tx.collectionQuiz.create({
      data: {
        collectionId,
        quizId: input.quizId,
        order: targetOrder,
      },
      include: {
        quiz: {
          select: {
            id: true,
            slug: true,
            title: true,
            difficulty: true,
            sport: true,
            descriptionImageUrl: true,
            isPublished: true,
            status: true,
          },
        },
      },
    });
  });
}

export async function reorderCollectionQuizzes(
  collectionId: string,
  items: Array<{ quizId: string; order: number }>
) {
  if (items.length === 0) {
    return [];
  }
  const uniqueQuizIds = new Set(items.map((item) => item.quizId));
  if (uniqueQuizIds.size !== items.length) {
    throw new BadRequestError("Duplicate quizId in reorder payload");
  }
  assertContiguousOrdering(items);

  return prisma.$transaction(async (tx) => {
    const collection = await tx.collection.findUnique({
      where: { id: collectionId },
      include: {
        quizzes: {
          select: { quizId: true },
        },
      },
    });

    if (!collection) throw new NotFoundError("Collection not found");

    const existingQuizIds = new Set(collection.quizzes.map((item) => item.quizId));
    if (items.length !== collection.quizzes.length) {
      throw new BadRequestError(
        "Reorder payload must include all quizzes in collection exactly once"
      );
    }
    for (const item of items) {
      if (!existingQuizIds.has(item.quizId)) {
        throw new BadRequestError("Reorder payload contains quiz not in collection");
      }
    }

    // Two-phase reorder avoids transient unique collisions on (collectionId, order).
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      await tx.collectionQuiz.update({
        where: {
          collectionId_quizId: {
            collectionId,
            quizId: item.quizId,
          },
        },
        data: { order: -1 * (index + 1) },
      });
    }

    for (const item of items) {
      await tx.collectionQuiz.update({
        where: {
          collectionId_quizId: {
            collectionId,
            quizId: item.quizId,
          },
        },
        data: { order: item.order },
      });
    }

    return tx.collectionQuiz.findMany({
      where: { collectionId },
      orderBy: { order: "asc" },
      include: {
        quiz: {
          select: {
            id: true,
            slug: true,
            title: true,
            difficulty: true,
            sport: true,
            descriptionImageUrl: true,
            isPublished: true,
            status: true,
          },
        },
      },
    });
  });
}

export async function removeQuizFromCollection(collectionId: string, quizId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.collectionQuiz.findUnique({
      where: {
        collectionId_quizId: {
          collectionId,
          quizId,
        },
      },
      select: {
        id: true,
        order: true,
      },
    });
    if (!existing) throw new NotFoundError("Quiz is not part of this collection");

    await tx.collectionQuiz.delete({
      where: { id: existing.id },
    });

    await tx.collectionQuiz.updateMany({
      where: {
        collectionId,
        order: { gt: existing.order },
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    });

    return { removed: true };
  });
}

function collectionQuizToCard(item: CollectionQuizWithSummary) {
  return {
    order: item.order,
    quiz: {
      id: item.quiz.id,
      slug: item.quiz.slug,
      title: item.quiz.title,
      difficulty: item.quiz.difficulty,
      sport: item.quiz.sport,
      descriptionImageUrl: item.quiz.descriptionImageUrl,
    },
  };
}

async function getCompletedQuizIdSetForQuizIds(
  userId: string,
  quizIds: string[]
): Promise<Set<string>> {
  if (quizIds.length === 0) return new Set();

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      quizId: { in: quizIds },
      completedAt: { not: null },
    },
    select: { quizId: true },
    distinct: ["quizId"],
  });

  return new Set(attempts.map((entry) => entry.quizId));
}

function getNextUncompletedQuiz(
  quizzes: Array<{ quizId: string; order: number; quiz: { id: string; slug: string; title: string } }>,
  completedQuizIds: Set<string>
) {
  const next = quizzes.find((entry) => !completedQuizIds.has(entry.quizId));
  if (!next) return null;
  return {
    id: next.quiz.id,
    slug: next.quiz.slug,
    title: next.quiz.title,
    order: next.order,
  };
}

export async function listPublishedCollections(filters: PublicCollectionListFilters) {
  const { page, limit, skip } = parsePagination(filters);
  const where: Prisma.CollectionWhereInput = {
    status: CollectionStatus.PUBLISHED,
  };
  if (filters.type) where.type = filters.type;
  if (filters.topicId) where.primaryTopicId = filters.topicId;
  if (filters.featured !== undefined) where.isFeatured = filters.featured;

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      skip,
      take: limit,
      include: {
        primaryTopic: {
          select: {
            id: true,
            name: true,
            slug: true,
            schemaType: true,
          },
        },
        quizzes: {
          where: {
            quiz: PLAYABLE_QUIZ_FILTER,
          },
          orderBy: { order: "asc" },
          take: 3,
          include: {
            quiz: {
              select: {
                id: true,
                slug: true,
                title: true,
                difficulty: true,
                sport: true,
                descriptionImageUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            quizzes: true,
            userProgress: true,
          },
        },
      },
    }),
    prisma.collection.count({ where }),
  ]);

  return {
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      coverImageUrl: collection.coverImageUrl,
      status: collection.status,
      type: collection.type,
      isFeatured: collection.isFeatured,
      primaryTopic: collection.primaryTopic,
      quizCount: collection._count.quizzes,
      followerCount: collection._count.userProgress,
      previewQuizzes: collection.quizzes.map(collectionQuizToCard),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: skip + collections.length < total,
      hasPrevious: page > 1,
    },
  };
}

export async function listPublishedCollectionsSafe(
  filters: PublicCollectionListFilters,
  context: string
) {
  try {
    return await listPublishedCollections(filters);
  } catch (error) {
    if (isCollectionFailOpenError(error)) {
      logCollectionFailOpen(context, error);
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 50) : 12;
      return {
        collections: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: page > 1,
        },
      };
    }
    throw error;
  }
}

export async function getPublishedCollectionDetail(
  slug: string,
  userId?: string
) {
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      primaryTopic: {
        select: {
          id: true,
          name: true,
          slug: true,
          schemaType: true,
        },
      },
      quizzes: {
        where: {
          quiz: PLAYABLE_QUIZ_FILTER,
        },
        orderBy: { order: "asc" },
        include: {
          quiz: {
            select: {
              id: true,
              slug: true,
              title: true,
              difficulty: true,
              sport: true,
              descriptionImageUrl: true,
              isPublished: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!collection || collection.status !== CollectionStatus.PUBLISHED) {
    throw new NotFoundError("Collection not found");
  }

  let progress:
    | {
        startedAt: string;
        lastPlayedAt: string;
        completedQuizCount: number;
        completedAt: string | null;
        nextQuiz: { id: string; slug: string; title: string; order: number } | null;
      }
    | undefined;

  if (userId) {
    const completedQuizIds = await getCompletedQuizIdSetForQuizIds(
      userId,
      collection.quizzes.map((entry) => entry.quizId)
    );
    const userProgress = await prisma.userCollectionProgress.findUnique({
      where: {
        userId_collectionId: {
          userId,
          collectionId: collection.id,
        },
      },
      select: {
        startedAt: true,
        lastPlayedAt: true,
        completedQuizCount: true,
        completedAt: true,
      },
    });
    if (userProgress) {
      progress = {
        startedAt: userProgress.startedAt.toISOString(),
        lastPlayedAt: userProgress.lastPlayedAt.toISOString(),
        completedQuizCount: Math.max(
          userProgress.completedQuizCount,
          completedQuizIds.size
        ),
        completedAt: userProgress.completedAt?.toISOString() ?? null,
        nextQuiz: getNextUncompletedQuiz(collection.quizzes, completedQuizIds),
      };
    }
  }

  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    coverImageUrl: collection.coverImageUrl,
    seoTitle: collection.seoTitle,
    seoDescription: collection.seoDescription,
    type: collection.type,
    isFeatured: collection.isFeatured,
    primaryTopic: collection.primaryTopic,
    quizzes: collection.quizzes.map(collectionQuizToCard),
    progress,
  };
}

export async function startOrResumeCollection(userId: string, collectionId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      quizzes: {
        where: {
          quiz: PLAYABLE_QUIZ_FILTER,
        },
        orderBy: { order: "asc" },
        include: {
          quiz: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!collection || collection.status !== CollectionStatus.PUBLISHED) {
    throw new NotFoundError("Collection not found");
  }
  if (collection.quizzes.length === 0) {
    throw new BadRequestError("Collection has no playable quizzes");
  }

  const completedQuizIds = await getCompletedQuizIdSetForQuizIds(
    userId,
    collection.quizzes.map((entry) => entry.quizId)
  );
  const totalQuizzes = collection.quizzes.length;
  const completedQuizCount = completedQuizIds.size;
  const nextQuiz = getNextUncompletedQuiz(collection.quizzes, completedQuizIds);

  const progress = await prisma.userCollectionProgress.upsert({
    where: {
      userId_collectionId: {
        userId,
        collectionId,
      },
    },
    update: {
      lastPlayedAt: new Date(),
      completedQuizCount,
      completedAt: completedQuizCount >= totalQuizzes ? new Date() : null,
      lastQuizId: nextQuiz?.id ?? null,
    },
    create: {
      userId,
      collectionId,
      startedAt: new Date(),
      lastPlayedAt: new Date(),
      completedQuizCount,
      completedAt: completedQuizCount >= totalQuizzes ? new Date() : null,
      lastQuizId: nextQuiz?.id ?? null,
    },
  });

  return {
    collectionId,
    progress: {
      startedAt: progress.startedAt.toISOString(),
      lastPlayedAt: progress.lastPlayedAt.toISOString(),
      completedQuizCount,
      totalQuizzes,
      completedAt: progress.completedAt?.toISOString() ?? null,
    },
    nextQuiz,
  };
}

export async function listUserInProgressCollections(userId: string) {
  const progressRows = await prisma.userCollectionProgress.findMany({
    where: {
      userId,
      collection: {
        status: CollectionStatus.PUBLISHED,
      },
      completedAt: null,
    },
    orderBy: [{ lastPlayedAt: "desc" }],
    include: {
      collection: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          coverImageUrl: true,
          type: true,
          quizzes: {
            where: {
              quiz: PLAYABLE_QUIZ_FILTER,
            },
            orderBy: { order: "asc" },
            include: {
              quiz: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
    take: 20,
  });

  return Promise.all(
    progressRows.map(async (row) => {
      if (row.collection.quizzes.length === 0) {
        return null;
      }

      const completedQuizIds = await getCompletedQuizIdSetForQuizIds(
        userId,
        row.collection.quizzes.map((entry) => entry.quizId)
      );
      const nextQuiz = getNextUncompletedQuiz(row.collection.quizzes, completedQuizIds);

      return {
        collectionId: row.collection.id,
        collection: {
          id: row.collection.id,
          name: row.collection.name,
          slug: row.collection.slug,
          description: row.collection.description,
          coverImageUrl: row.collection.coverImageUrl,
          type: row.collection.type,
          totalQuizzes: row.collection.quizzes.length,
        },
        progress: {
          startedAt: row.startedAt.toISOString(),
          lastPlayedAt: row.lastPlayedAt.toISOString(),
          completedQuizCount: Math.max(
            row.completedQuizCount,
            completedQuizIds.size
          ),
        },
        nextQuiz,
      };
    })
  ).then((rows) => rows.filter((row): row is NonNullable<typeof row> => row !== null));
}

export async function listUserInProgressCollectionsSafe(
  userId: string,
  context: string
) {
  try {
    return await listUserInProgressCollections(userId);
  } catch (error) {
    if (isCollectionFailOpenError(error)) {
      logCollectionFailOpen(context, error);
      return [];
    }
    throw error;
  }
}

export async function touchCollectionProgressOnQuizCompletion(
  userId: string,
  quizId: string
) {
  const memberships = await prisma.collectionQuiz.findMany({
    where: {
      quizId,
      collection: {
        status: CollectionStatus.PUBLISHED,
      },
    },
    select: {
      collectionId: true,
    },
    distinct: ["collectionId"],
  });

  if (memberships.length === 0) return;

  await Promise.all(
    memberships.map(async ({ collectionId }) => {
      const allQuizzes = await prisma.collectionQuiz.findMany({
        where: {
          collectionId,
          quiz: PLAYABLE_QUIZ_FILTER,
        },
        select: {
          quizId: true,
          order: true,
          quiz: {
            select: { id: true, slug: true, title: true },
          },
        },
        orderBy: { order: "asc" },
      });

      const completedQuizIds = await getCompletedQuizIdSetForQuizIds(
        userId,
        allQuizzes.map((entry) => entry.quizId)
      );

      const completedQuizCount = completedQuizIds.size;
      const totalQuizzes = allQuizzes.length;
      const nextQuiz = getNextUncompletedQuiz(allQuizzes, completedQuizIds);

      await prisma.userCollectionProgress.upsert({
        where: {
          userId_collectionId: {
            userId,
            collectionId,
          },
        },
        update: {
          lastPlayedAt: new Date(),
          lastQuizId: quizId,
          completedQuizCount,
          completedAt: totalQuizzes > 0 && completedQuizCount >= totalQuizzes ? new Date() : null,
        },
        create: {
          userId,
          collectionId,
          startedAt: new Date(),
          lastPlayedAt: new Date(),
          lastQuizId: quizId,
          completedQuizCount,
          completedAt: totalQuizzes > 0 && completedQuizCount >= totalQuizzes ? new Date() : null,
        },
      });

      if (nextQuiz) {
        await prisma.userCollectionProgress.update({
          where: {
            userId_collectionId: {
              userId,
              collectionId,
            },
          },
          data: {
            lastQuizId: nextQuiz.id,
          },
        });
      }
    })
  );
}
