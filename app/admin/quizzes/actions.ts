"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { Difficulty, Prisma } from "@prisma/client";

interface AvailableQuestionsInput {
  search?: string;
  topicId?: string;
  difficulty?: Difficulty | "";
  excludeIds?: string[];
  limit?: number;
}

export async function getAvailableQuestions({
  search = "",
  topicId,
  difficulty,
  excludeIds = [],
  limit = 100,
}: AvailableQuestionsInput) {
  await requireAdmin();

  const where: Prisma.QuestionWhereInput = {};

  if (search) {
    where.questionText = { contains: search, mode: "insensitive" };
  }

  if (topicId) {
    where.topicId = topicId;
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  if (excludeIds.length > 0) {
    where.id = { notIn: excludeIds };
  }

  const questions = await prisma.question.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      questionText: true,
      difficulty: true,
      topic: {
        select: {
          id: true,
          name: true,
        },
      },
      answers: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
        },
      },
    },
  });

  return questions.map((question) => ({
    id: question.id,
    questionText: question.questionText,
    difficulty: question.difficulty,
    topic: question.topic
      ? {
        id: question.topic.id,
        name: question.topic.name,
      }
      : null,
    answers: question.answers.map((answer) => ({
      id: answer.id,
    })),
  }));
}

import { generateQuizMetadataAI } from "@/lib/services/ai-seo.service";
import { revalidatePath } from "next/cache";

export async function regenerateQuizSEOAction(quizId: string) {
  await requireAdmin();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { title: true, description: true },
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  const aiMetadata = await generateQuizMetadataAI(quiz.title, quiz.description);

  if (!aiMetadata) {
    throw new Error("Failed to generate AI metadata");
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: {
      seoTitle: aiMetadata.title,
      seoDescription: aiMetadata.description,
      seoKeywords: aiMetadata.keywords,
    },
  });

  revalidatePath(`/admin/quizzes/${quizId}/edit`);
  revalidatePath(`/quizzes/${quizId}`); // Also revalidate public page if possible (need slug for that usually)

  return aiMetadata;
}
