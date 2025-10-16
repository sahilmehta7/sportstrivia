import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse } from "@/lib/errors";
import {
  type PublicQuizFilters,
  buildPublicQuizWhereClause,
  buildQuizOrderBy,
  calculatePagination,
  buildPaginationResult,
} from "@/lib/dto/quiz-filters.dto";
import { Difficulty } from "@prisma/client";

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

    const { skip, take } = calculatePagination(filters.page!, filters.limit!);
    const where = buildPublicQuizWhereClause(filters);
    const orderBy = buildQuizOrderBy(filters.sortBy, filters.sortOrder);

    // Get quizzes with pagination
    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          descriptionImageUrl: true,
          sport: true,
          difficulty: true,
          duration: true,
          passingScore: true,
          averageRating: true,
          totalReviews: true,
          isFeatured: true,
          startTime: true,
          endTime: true,
          createdAt: true,
          _count: {
            select: {
              questionPool: true,
              attempts: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      prisma.quiz.count({ where }),
    ]);

    return successResponse({
      quizzes,
      pagination: buildPaginationResult(filters.page!, filters.limit!, total),
      filters: {
        sport: filters.sport,
        difficulty: filters.difficulty,
        tag: filters.tag,
        topic: filters.topic,
        isFeatured: filters.isFeatured,
        comingSoon: filters.comingSoon,
        minDuration: filters.minDuration ? filters.minDuration / 60 : null,
        maxDuration: filters.maxDuration ? filters.maxDuration / 60 : null,
        minRating: filters.minRating,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

