import { NextRequest } from "next/server";
import { SearchContext } from "@prisma/client";
import { auth } from "@/lib/auth";
import { handleError, successResponse, ValidationError } from "@/lib/errors";
import {
  getRecentSearchQueriesForUser,
  getTrendingSearchQueries,
} from "@/lib/services/search-query.service";
import { validateSearchQuery } from "@/lib/validations/search.schema";
import { searchSuggestionsRateLimiter, checkRateLimit } from "@/lib/rate-limit";

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
    // Apply rate limiting
    const identifier = request.ip || request.headers.get("x-forwarded-for") || "anonymous";
    const rateLimitResult = await checkRateLimit(identifier, searchSuggestionsRateLimiter);
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
            "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
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
