import { Prisma, Difficulty, QuestionType } from "@prisma/client";

/**
 * Type-safe DTO for question list filters
 */
export interface QuestionListFilters {
  page?: number;
  limit?: number;
  search?: string;
  topicId?: string;
  difficulty?: Difficulty;
  type?: QuestionType;
}

/**
 * Build type-safe where clause for question queries
 */
export function buildQuestionWhereClause(filters: QuestionListFilters): Prisma.QuestionWhereInput {
  const where: Prisma.QuestionWhereInput = {};

  if (filters.search) {
    where.questionText = { contains: filters.search, mode: "insensitive" };
  }

  if (filters.topicId) {
    where.topicId = filters.topicId;
  }

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  return where;
}

/**
 * Standard question include for list queries
 */
export const questionListInclude: Prisma.QuestionInclude = {
  topic: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  answers: {
    orderBy: { displayOrder: "asc" },
  },
  _count: {
    select: {
      quizPools: true,
      userAnswers: true,
    },
  },
};

/**
 * Standard question select for public queries (hides correct answers)
 */
export const publicQuestionSelect = {
  id: true,
  questionText: true,
  questionImageUrl: true,
  questionVideoUrl: true,
  questionAudioUrl: true,
  hint: true,
  timeLimit: true,
  randomizeAnswerOrder: true,
  answers: {
    select: {
      id: true,
      answerText: true,
      answerImageUrl: true,
      answerVideoUrl: true,
      answerAudioUrl: true,
      displayOrder: true,
      // Exclude isCorrect from public queries
    },
    orderBy: { displayOrder: "asc" as const },
  },
};

