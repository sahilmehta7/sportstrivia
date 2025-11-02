import { Prisma, SearchContext } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordSearchQuery } from "@/lib/services/search-query.service";

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
 * Fetch root topics with quiz counts for the topics browse page
 * Temporarily showing all root topics for debugging
 */
export async function getRootTopics() {
  return await prisma.topic.findMany({
    where: { 
      parentId: null
    },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { 
          quizTopicConfigs: true,
          children: true
        }
      }
    }
  });
}

/**
 * Get featured topics (top by quiz count) for the topics browse page
 * Shows topics that have quizzes OR are popular sports categories
 */
export async function getFeaturedTopics(limit = 6) {
  const popularSports = ['Cricket', 'Football (Soccer)', 'Tennis', 'Basketball', 'Baseball', 'Golf', 'Rugby', 'American Football', 'Boxing', 'MMA'];
  
  return await prisma.topic.findMany({
    where: { 
      parentId: null,
      OR: [
        {
          quizTopicConfigs: {
            some: {} // Direct quizzes
          }
        },
        {
          children: {
            some: {
              quizTopicConfigs: {
                some: {} // Quizzes through children
              }
            }
          }
        },
        {
          name: {
            in: popularSports // Popular sports even without quizzes
          }
        }
      ]
    },
    orderBy: [
      {
        quizTopicConfigs: { _count: "desc" }
      },
      { name: "asc" }
    ],
    take: limit,
    include: {
      _count: {
        select: { 
          quizTopicConfigs: true,
          children: true
        }
      }
    }
  });
}

/**
 * Get L2 topics for popular sports (Cricket, Football, Tennis, etc.)
 * Only includes L2 topics that have quizzes
 */
export async function getL2TopicsForPopularSports() {
  const popularSports = ['Cricket', 'Football (Soccer)', 'Tennis', 'Basketball', 'Baseball', 'Golf', 'Rugby'];
  
  return await prisma.topic.findMany({
    where: {
      parent: {
        name: {
          in: popularSports
        }
      },
      quizTopicConfigs: {
        some: {} // Only L2 topics that have quizzes
      }
    },
    orderBy: [
      { parent: { name: "asc" } },
      { name: "asc" }
    ],
    include: {
      parent: {
        select: {
          name: true,
          slug: true
        }
      },
      _count: {
        select: { quizTopicConfigs: true }
      }
    }
  });
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

interface SearchTopicsInput {
  query: string;
  page?: number;
  limit?: number;
}

interface SearchTopicsOptions {
  telemetryUserId?: string;
  telemetryEnabled?: boolean;
}

const MAX_TOPIC_SEARCH_LIMIT = 50;

export async function searchTopics(
  input: SearchTopicsInput,
  options: SearchTopicsOptions = {}
) {
  const { query, page = 1, limit = 20 } = input;
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return {
      topics: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }

  const take = Math.min(Math.max(limit, 1), MAX_TOPIC_SEARCH_LIMIT);
  const currentPage = Math.max(page, 1);
  const skip = (currentPage - 1) * take;

  // Use full-text search with ranking for better performance and relevance
  // First, get topic IDs matching the search query with ranking
  const searchResults = await prisma.$queryRaw<Array<{ id: string; rank: number }>>`
    SELECT 
      t.id,
      ts_rank(t.fts, plainto_tsquery('english', ${trimmedQuery})) as rank
    FROM "Topic" t
    WHERE t.fts @@ plainto_tsquery('english', ${trimmedQuery})
    ORDER BY rank DESC, t.level ASC, t.name ASC
    LIMIT ${take}
    OFFSET ${skip}
  `;

  const totalResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count
    FROM "Topic"
    WHERE fts @@ plainto_tsquery('english', ${trimmedQuery})
  `;

  const total = Number(totalResult[0]?.count || 0);
  const topicIds = searchResults.map((r) => r.id);

  // Fetch full topic records with relations
  const topics = await prisma.topic.findMany({
    where: {
      id: { in: topicIds },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      level: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          quizTopicConfigs: true,
        },
      },
    },
  });

  // Reorder topics to match full-text search ranking (highest rank first)
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const orderedTopics = topicIds
    .map((id) => topicMap.get(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  if (options.telemetryEnabled !== false) {
    await recordSearchQuery({
      query: trimmedQuery,
      context: SearchContext.TOPIC,
      resultCount: total,
      userId: options.telemetryUserId,
    });
  }

  return {
    topics: orderedTopics,
    pagination: {
      page: currentPage,
      limit: take,
      total,
      pages: Math.ceil(total / take),
    },
  };
}
