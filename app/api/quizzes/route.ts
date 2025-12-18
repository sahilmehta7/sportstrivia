import { NextRequest } from "next/server";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { type PublicQuizFilters } from "@/lib/dto/quiz-filters.dto";
import { Difficulty } from "@prisma/client";
import { getPublicQuizList } from "@/lib/services/public-quiz.service";
import { validateSearchQuery } from "@/lib/validations/search.schema";
import { searchRateLimiter, checkRateLimit } from "@/lib/rate-limit";

// GET /api/quizzes - List published quizzes with advanced filtering and sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Apply rate limiting (only if search query is present)
    const rawSearch = searchParams.get("search");
    if (rawSearch) {
      const identifier = request.headers.get("x-forwarded-for")?.split(',')[0] || "anonymous";
      const rateLimitResult = await checkRateLimit(identifier, searchRateLimiter);

      if (!rateLimitResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Too many search requests. Please try again later.",
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
              "Cache-Control": "no-store", // Do not cache rate limit errors
            },
          }
        );
      }
    }

    // Validate and sanitize search query
    const search = rawSearch ? validateSearchQuery(rawSearch) : undefined;

    // If search query was provided but is invalid/too long, return error
    if (rawSearch && !search && rawSearch.trim().length > 0) {
      throw new BadRequestError("Search query must be 200 characters or less");
    }

    // Parse filters with type safety
    const filters: PublicQuizFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "12"),
      search,
      sport: searchParams.get("sport") ?? undefined,
      difficulty: (searchParams.get("difficulty") as Difficulty) || undefined,
      tag: searchParams.get("tag") || undefined,
      topic: searchParams.get("topic") || undefined,
      isFeatured: searchParams.get("featured") === "true",
      comingSoon: searchParams.get("comingSoon") === "true",
      minDuration: searchParams.get("minDuration")
        ? parseInt(searchParams.get("minDuration")!) * 60
        : undefined,
      maxDuration: searchParams.get("maxDuration")
        ? parseInt(searchParams.get("maxDuration")!) * 60
        : undefined,
      minRating: searchParams.get("minRating")
        ? parseFloat(searchParams.get("minRating")!)
        : undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const result = await getPublicQuizList(filters);

    return successResponse(result, 200, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    });
  } catch (error) {
    return handleError(error);
  }
}

