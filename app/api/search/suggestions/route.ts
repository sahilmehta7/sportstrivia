import { NextRequest } from "next/server";
import { SearchContext } from "@prisma/client";
import { auth } from "@/lib/auth";
import { handleError, successResponse, ValidationError } from "@/lib/errors";
import {
  getRecentSearchQueriesForUser,
  getTrendingSearchQueries,
} from "@/lib/services/search-query.service";

function parseContext(value: string | null): SearchContext {
  if (!value) return SearchContext.QUIZ;

  const normalized = value.toUpperCase();
  if (normalized in SearchContext) {
    return normalized as SearchContext;
  }

  throw new ValidationError("Unsupported search context", {
    context: value,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const context = parseContext(searchParams.get("context"));
    const session = await auth();
    const userId = session?.user?.id;

    const [trending, recent] = await Promise.all([
      getTrendingSearchQueries(context, { limit: 8 }),
      userId ? getRecentSearchQueriesForUser(userId, context, { limit: 6 }) : [],
    ]);

    const suggestions = {
      recent: recent.map((entry) => ({
        query: entry.query,
        source: "recent" as const,
        resultCount: entry.resultCount ?? null,
        lastSearchedAt: entry.lastSearchedAt ? entry.lastSearchedAt.toISOString() : null,
        timesSearched: entry.timesSearched,
      })),
      trending: trending.map((entry) => ({
        query: entry.query,
        source: "trending" as const,
        resultCount: entry.lastResultCount ?? null,
        lastSearchedAt: entry.lastSearchedAt ? entry.lastSearchedAt.toISOString() : null,
        timesSearched: entry.timesSearched,
      })),
    };

    return successResponse({
      context,
      suggestions,
    });
  } catch (error) {
    return handleError(error);
  }
}
