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
import {
  AttemptResetPeriod as PrismaAttemptResetPeriod,
  Difficulty,
  QuizStatus,
  RecurringType,
} from "@prisma/client";
import {
  AttemptResetPeriod as AttemptResetPeriodConst,
  isAttemptResetPeriod,
} from "@/constants/attempts";

function toPrismaAttemptResetPeriod(
  value: string | PrismaAttemptResetPeriod
): PrismaAttemptResetPeriod {
  return PrismaAttemptResetPeriod[
    value as keyof typeof PrismaAttemptResetPeriod
  ];
}

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
    
    // Convert null values and empty strings to undefined for optional fields
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => {
        if (key === "maxAttemptsPerUser") {
          if (
            value === null ||
            value === undefined ||
            (typeof value === "string" && value.trim() === "")
          ) {
            return [key, null];
          }
          const parsed =
            typeof value === "number" ? value : parseInt(String(value), 10);
          return [key, Number.isNaN(parsed) ? null : parsed];
        }

        if (key === "attemptResetPeriod") {
          if (isAttemptResetPeriod(value)) {
            return [key, value];
          }
          return [key, undefined];
        }

        if (value === null) return [key, undefined];
        if (
          value === "" &&
          ["startTime", "endTime", "answersRevealTime", "descriptionImageUrl", "descriptionVideoUrl"].includes(key)
        ) {
          return [key, undefined];
        }
        return [key, value];
      })
    );
    
    const validatedData = quizSchema.parse(cleanedBody);

    // If completionBonus not provided or zero, derive a default = 100 x question count
    // For new quizzes, we only have questionCount (POOL_RANDOM) or explicit; otherwise leave 0
    let completionBonus = validatedData.completionBonus ?? 0;
    if (!completionBonus || completionBonus <= 0) {
      const questionCount = typeof validatedData.questionCount === 'number' ? validatedData.questionCount : undefined;
      if (questionCount && questionCount > 0) {
        completionBonus = questionCount * 100;
      }
    }

    // Generate unique slug if not provided
    const slug = validatedData.slug
      ? await generateUniqueSlug(validatedData.slug, "quiz")
      : await generateUniqueSlug(validatedData.title, "quiz");

    // Parse datetime strings to Date objects
    const quizData: any = {
      ...validatedData,
      slug,
    };

  // Apply derived completionBonus if computed
  if (completionBonus && completionBonus > 0) {
    quizData.completionBonus = completionBonus;
  }

    if (validatedData.startTime) {
      quizData.startTime = new Date(validatedData.startTime);
    }
    if (validatedData.endTime) {
      quizData.endTime = new Date(validatedData.endTime);
    }
    if (validatedData.answersRevealTime) {
      quizData.answersRevealTime = new Date(validatedData.answersRevealTime);
    }

    const finalRecurringType = validatedData.recurringType ?? RecurringType.NONE;

    if (validatedData.maxAttemptsPerUser === null || validatedData.maxAttemptsPerUser === undefined) {
      quizData.maxAttemptsPerUser = null;
      quizData.attemptResetPeriod = PrismaAttemptResetPeriod.NEVER;
    } else {
      quizData.maxAttemptsPerUser = validatedData.maxAttemptsPerUser;
      const attemptResetPeriodValue =
        validatedData.attemptResetPeriod ?? AttemptResetPeriodConst.NEVER;
      quizData.attemptResetPeriod =
        finalRecurringType === RecurringType.NONE
          ? PrismaAttemptResetPeriod.NEVER
          : toPrismaAttemptResetPeriod(attemptResetPeriodValue);
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
