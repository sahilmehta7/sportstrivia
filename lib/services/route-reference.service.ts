import "server-only";

import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

function normalizePathReference(reference: string): string {
  const normalized = reference.trim();
  if (!normalized) {
    throw new NotFoundError("Resource not found");
  }
  return normalized;
}

export async function resolveCollectionIdFromPathReference(
  reference: string,
  options?: { allowIdFallback?: boolean }
): Promise<string> {
  const normalized = normalizePathReference(reference);
  const allowIdFallback = options?.allowIdFallback ?? true;

  const collectionBySlug = await prisma.collection.findUnique({
    where: { slug: normalized },
    select: { id: true },
  });
  if (collectionBySlug) return collectionBySlug.id;

  if (allowIdFallback) {
    const collectionById = await prisma.collection.findUnique({
      where: { id: normalized },
      select: { id: true },
    });
    if (collectionById) return collectionById.id;
  }

  throw new NotFoundError("Collection not found");
}

export async function resolveTopicIdFromPathReference(
  reference: string,
  options?: { allowIdFallback?: boolean }
): Promise<string> {
  const normalized = normalizePathReference(reference);
  const allowIdFallback = options?.allowIdFallback ?? false;

  const topicBySlug = await prisma.topic.findUnique({
    where: { slug: normalized },
    select: { id: true },
  });
  if (topicBySlug) return topicBySlug.id;

  if (allowIdFallback) {
    const topicById = await prisma.topic.findUnique({
      where: { id: normalized },
      select: { id: true },
    });
    if (topicById) return topicById.id;
  }

  throw new NotFoundError("Topic not found");
}
