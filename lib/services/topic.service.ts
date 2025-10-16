import { prisma } from "@/lib/db";

/**
 * In-memory cache for topic hierarchies
 * Cache duration: 5 minutes
 */
interface TopicCache {
  descendants: Map<string, string[]>;
  lastUpdated: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

let topicCache: TopicCache | null = null;

/**
 * Check if cache is valid
 */
function isCacheValid(): boolean {
  if (!topicCache) return false;
  return Date.now() - topicCache.lastUpdated < CACHE_DURATION;
}

/**
 * Build topic hierarchy cache
 * Fetches all topics once and builds a map of parent -> descendants
 */
async function buildTopicCache(): Promise<TopicCache> {
  const allTopics = await prisma.topic.findMany({
    select: {
      id: true,
      parentId: true,
    },
  });

  // Build adjacency list
  const children = new Map<string, string[]>();
  
  for (const topic of allTopics) {
    if (topic.parentId) {
      const siblings = children.get(topic.parentId) || [];
      siblings.push(topic.id);
      children.set(topic.parentId, siblings);
    }
  }

  // Build descendants map (includes all nested children)
  const descendants = new Map<string, string[]>();

  function getDescendants(topicId: string): string[] {
    if (descendants.has(topicId)) {
      return descendants.get(topicId)!;
    }

    const directChildren = children.get(topicId) || [];
    const allDescendants = [...directChildren];

    for (const childId of directChildren) {
      allDescendants.push(...getDescendants(childId));
    }

    descendants.set(topicId, allDescendants);
    return allDescendants;
  }

  // Pre-compute descendants for all topics
  for (const topic of allTopics) {
    getDescendants(topic.id);
  }

  return {
    descendants,
    lastUpdated: Date.now(),
  };
}

/**
 * Get all descendant topic IDs for a given topic ID (cached)
 * Returns an empty array if the topic has no descendants
 */
export async function getDescendantTopicIds(topicId: string): Promise<string[]> {
  if (!isCacheValid()) {
    topicCache = await buildTopicCache();
  }

  return topicCache!.descendants.get(topicId) || [];
}

/**
 * Get all descendant topic IDs for multiple parent topics (batch operation)
 * Returns a map of parentId -> descendantIds[]
 */
export async function getDescendantTopicIdsForMultiple(
  topicIds: string[]
): Promise<Map<string, string[]>> {
  if (!isCacheValid()) {
    topicCache = await buildTopicCache();
  }

  const result = new Map<string, string[]>();
  
  for (const topicId of topicIds) {
    result.set(topicId, topicCache!.descendants.get(topicId) || []);
  }

  return result;
}

/**
 * Get topic IDs including the parent and all descendants
 */
export async function getTopicIdsWithDescendants(topicId: string): Promise<string[]> {
  const descendants = await getDescendantTopicIds(topicId);
  return [topicId, ...descendants];
}

/**
 * Invalidate the topic cache
 * Call this when topics are created, updated, or deleted
 */
export function invalidateTopicCache(): void {
  topicCache = null;
}

/**
 * Get topic hierarchy for display purposes (uncached, for admin)
 */
export async function getTopicHierarchy(topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
        },
      },
    },
  });

  return topic;
}

/**
 * Fetch topic tree with all descendants (recursive, uncached)
 * Use this sparingly - prefer cached getDescendantTopicIds for performance
 */
export async function getTopicTree(parentId: string | null = null): Promise<any[]> {
  const topics = await prisma.topic.findMany({
    where: { parentId },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: {
          children: true,
          questions: true,
        },
      },
    },
  });

  const result = [];
  
  for (const topic of topics) {
    const children = await getTopicTree(topic.id);
    result.push({
      ...topic,
      children,
    });
  }

  return result;
}

