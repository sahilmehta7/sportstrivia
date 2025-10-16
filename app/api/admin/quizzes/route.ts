import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { quizSchema } from "@/lib/validations/quiz.schema";
import { handleError, successResponse } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/services/slug.service";
import {
  type QuizListFilters,
  buildQuizWhereClause,
  calculatePagination,
  buildPaginationResult,
} from "@/lib/dto/quiz-filters.dto";
import { Difficulty, QuizStatus } from "@prisma/client";

// GET /api/admin/quizzes - List all quizzes with filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    
    // Parse filters with type safety
    const filters: QuizListFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      sport: searchParams.get("sport") || undefined,
      difficulty: (searchParams.get("difficulty") as Difficulty) || undefined,
      status: (searchParams.get("status") as QuizStatus) || undefined,
    };

    const { skip, take } = calculatePagination(filters.page!, filters.limit!);
    const where = buildQuizWhereClause(filters);

    // Get quizzes with pagination
    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              questionPool: true,
              attempts: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.quiz.count({ where }),
    ]);

    return successResponse({
      quizzes,
      pagination: buildPaginationResult(filters.page!, filters.limit!, total),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/quizzes - Create new quiz
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validatedData = quizSchema.parse(body);

    // Generate unique slug if not provided
    const slug = validatedData.slug
      ? await generateUniqueSlug(validatedData.slug, "quiz")
      : await generateUniqueSlug(validatedData.title, "quiz");

    // Parse datetime strings to Date objects
    const quizData: any = {
      ...validatedData,
      slug,
    };

    if (validatedData.startTime) {
      quizData.startTime = new Date(validatedData.startTime);
    }
    if (validatedData.endTime) {
      quizData.endTime = new Date(validatedData.endTime);
    }
    if (validatedData.answersRevealTime) {
      quizData.answersRevealTime = new Date(validatedData.answersRevealTime);
    }

    const quiz = await prisma.quiz.create({
      data: quizData,
      include: {
        _count: {
          select: {
            questionPool: true,
          },
        },
      },
    });

    return successResponse(quiz, 201);
  } catch (error) {
    return handleError(error);
  }
}

