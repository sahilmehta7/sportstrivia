import { NextRequest } from "next/server";
import { handleError, successResponse } from "@/lib/errors";
import { type PublicQuizFilters } from "@/lib/dto/quiz-filters.dto";
import { Difficulty } from "@prisma/client";
import { getPublicQuizList } from "@/lib/services/public-quiz.service";

// GET /api/quizzes - List published quizzes with advanced filtering and sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters with type safety
    const filters: PublicQuizFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "12"),
      search: searchParams.get("search") || undefined,
      sport: searchParams.get("sport") || undefined,
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

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}

