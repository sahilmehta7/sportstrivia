import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { questionSchema } from "@/lib/validations/question.schema";
import { handleError, successResponse } from "@/lib/errors";
import {
  type QuestionListFilters,
  buildQuestionWhereClause,
  questionListInclude,
} from "@/lib/dto/question-filters.dto";
import { calculatePagination, buildPaginationResult } from "@/lib/dto/quiz-filters.dto";
import { Difficulty, QuestionType } from "@prisma/client";

// GET /api/admin/questions - List all questions with filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    
    // Parse filters with type safety
    const filters: QuestionListFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      search: searchParams.get("search") || undefined,
      topicId: searchParams.get("topicId") || undefined,
      difficulty: (searchParams.get("difficulty") as Difficulty) || undefined,
      type: (searchParams.get("type") as QuestionType) || undefined,
    };

    const { skip, take } = calculatePagination(filters.page!, filters.limit!);
    const where = buildQuestionWhereClause(filters);

    // Get questions with pagination
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: questionListInclude,
      }),
      prisma.question.count({ where }),
    ]);

    return successResponse({
      questions,
      pagination: buildPaginationResult(filters.page!, filters.limit!, total),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/questions - Create new question with answers
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validatedData = questionSchema.parse(body);

    // Create question with answers in a transaction
    const question = await prisma.question.create({
      data: {
        type: validatedData.type,
        topicId: validatedData.topicId,
        difficulty: validatedData.difficulty,
        questionText: validatedData.questionText,
        questionImageUrl: validatedData.questionImageUrl,
        questionVideoUrl: validatedData.questionVideoUrl,
        questionAudioUrl: validatedData.questionAudioUrl,
        hint: validatedData.hint,
        explanation: validatedData.explanation,
        explanationImageUrl: validatedData.explanationImageUrl,
        explanationVideoUrl: validatedData.explanationVideoUrl,
        randomizeAnswerOrder: validatedData.randomizeAnswerOrder,
        timeLimit: validatedData.timeLimit,
        answers: {
          create: validatedData.answers.map((answer) => ({
            answerText: answer.answerText,
            answerImageUrl: answer.answerImageUrl,
            answerVideoUrl: answer.answerVideoUrl,
            answerAudioUrl: answer.answerAudioUrl,
            isCorrect: answer.isCorrect,
            displayOrder: answer.displayOrder,
          })),
        },
      },
      include: {
        topic: true,
        answers: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    return successResponse(question, 201);
  } catch (error) {
    return handleError(error);
  }
}

