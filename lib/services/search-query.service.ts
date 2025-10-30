import { SearchContext } from "@prisma/client";
import { prisma } from "@/lib/db";

interface RecordSearchQueryOptions {
  query: string;
  context: SearchContext;
  resultCount: number;
  userId?: string;
}

interface TrendingSearchOptions {
  limit?: number;
  days?: number;
}

interface RecentSearchOptions {
  limit?: number;
}

const DEFAULT_TRENDING_DAYS = 7;

export async function recordSearchQuery({
  query,
  context,
  resultCount,
  userId,
}: RecordSearchQueryOptions): Promise<void> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return;

  const now = new Date();

  const searchQuery = await prisma.searchQuery.upsert({
    where: {
      query_context: {
        query: normalized,
        context,
      },
    },
    update: {
      timesSearched: { increment: 1 },
      lastResultCount: resultCount,
      lastSearchedAt: now,
    },
    create: {
      query: normalized,
      context,
      timesSearched: 1,
      lastResultCount: resultCount,
      lastSearchedAt: now,
    },
  });

  if (userId) {
    await prisma.userSearchQuery.upsert({
      where: {
        userId_searchQueryId: {
          userId,
          searchQueryId: searchQuery.id,
        },
      },
      update: {
        timesSearched: { increment: 1 },
        lastSearchedAt: now,
      },
      create: {
        userId,
        searchQueryId: searchQuery.id,
        timesSearched: 1,
        lastSearchedAt: now,
      },
    });
  }
}

export async function getTrendingSearchQueries(
  context: SearchContext,
  options: TrendingSearchOptions = {}
) {
  const limit = options.limit ?? 6;
  const days = options.days ?? DEFAULT_TRENDING_DAYS;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return prisma.searchQuery.findMany({
    where: {
      context,
      lastSearchedAt: { gte: since },
    },
    orderBy: [
      { timesSearched: "desc" },
      { lastSearchedAt: "desc" },
    ],
    take: limit,
  });
}

export async function getRecentSearchQueriesForUser(
  userId: string,
  context: SearchContext,
  options: RecentSearchOptions = {}
) {
  const limit = options.limit ?? 6;

  const entries = await prisma.userSearchQuery.findMany({
    where: {
      userId,
      searchQuery: {
        context,
      },
    },
    orderBy: {
      lastSearchedAt: "desc",
    },
    take: limit,
    include: {
      searchQuery: true,
    },
  });

  return entries.map((entry) => ({
    query: entry.searchQuery.query,
    lastSearchedAt: entry.lastSearchedAt,
    timesSearched: entry.timesSearched,
    resultCount: entry.searchQuery.lastResultCount ?? null,
  }));
}
