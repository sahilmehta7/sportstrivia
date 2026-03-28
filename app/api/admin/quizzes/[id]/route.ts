import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { quizUpdateSchema } from "@/lib/validations/quiz.schema";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/seo-utils";
import {
  AttemptResetPeriod as PrismaAttemptResetPeriod,
  RecurringType,
} from "@prisma/client";
import { isAttemptResetPeriod } from "@/constants/attempts";

function toPrismaAttemptResetPeriod(
  value: string | PrismaAttemptResetPeriod
): PrismaAttemptResetPeriod {
  return PrismaAttemptResetPeriod[
    value as keyof typeof PrismaAttemptResetPeriod
  ];
}

function isSitemapEligible(isPublished: boolean, status: string): boolean {
  return isPublished && status === "PUBLISHED";
}

// GET /api/admin/quizzes/[id] - Get single quiz
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questionPool: {
          include: {
            question: {
              include: {
                answers: true,
                topic: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        topicConfigs: {
          include: {
            topic: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            attempts: true,
            reviews: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    return successResponse(quiz);
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/quizzes/[id] - Update quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();

    // Debug: Log the datetime fields
    console.log("Datetime fields received:", {
      startTime: body.startTime,
      endTime: body.endTime,
      answersRevealTime: body.answersRevealTime,
    });

    // Convert null values and empty strings to undefined for optional fields
    // Especially important for datetime fields which fail validation with empty strings
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

        // Handle PlayMode
        if (key === "playMode") {
          return [key, value];
        }

        // Convert null to undefined
        if (value === null) return [key, undefined];

        // Convert empty strings to undefined for datetime and URL fields
        if (typeof value === "string" && value.trim() === "" &&
          ["startTime", "endTime", "answersRevealTime", "descriptionImageUrl", "descriptionVideoUrl", "seoTitle", "seoDescription"].includes(key)) {
          return [key, undefined];
        }

        return [key, value];
      })
    );

    console.log("Cleaned datetime fields:", {
      startTime: cleanedBody.startTime,
      endTime: cleanedBody.endTime,
      answersRevealTime: cleanedBody.answersRevealTime,
    });

    const validatedData = quizUpdateSchema.parse(cleanedBody) as any;

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!existingQuiz) {
      throw new NotFoundError("Quiz not found");
    }

    const wasSitemapEligible = isSitemapEligible(existingQuiz.isPublished, existingQuiz.status);

    // Generate unique slug if title changed
    let slug = existingQuiz.slug;
    if (validatedData.slug && validatedData.slug !== existingQuiz.slug) {
      slug = await generateUniqueSlug(validatedData.slug, existingQuiz.slug);
    } else if (validatedData.title && validatedData.title !== existingQuiz.title) {
      slug = await generateUniqueSlug(validatedData.title, existingQuiz.slug);
    }

    // Parse datetime strings to Date objects
    const updateData: any = {
      ...validatedData,
      slug,
    };

    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime);
    }
    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime);
    }
    if (validatedData.answersRevealTime) {
      updateData.answersRevealTime = new Date(validatedData.answersRevealTime);
    }

    const nextRecurringType =
      validatedData.recurringType ?? existingQuiz.recurringType ?? RecurringType.NONE;

    if (validatedData.maxAttemptsPerUser !== undefined) {
      if (validatedData.maxAttemptsPerUser === null) {
        updateData.maxAttemptsPerUser = null;
        updateData.attemptResetPeriod = PrismaAttemptResetPeriod.NEVER;
      } else {
        updateData.maxAttemptsPerUser = validatedData.maxAttemptsPerUser;
        const attemptResetPeriodCandidate =
          validatedData.attemptResetPeriod ??
          existingQuiz.attemptResetPeriod ??
          PrismaAttemptResetPeriod.NEVER;
        updateData.attemptResetPeriod =
          nextRecurringType === RecurringType.NONE
            ? PrismaAttemptResetPeriod.NEVER
            : toPrismaAttemptResetPeriod(attemptResetPeriodCandidate);
      }
    } else if (validatedData.attemptResetPeriod !== undefined) {
      if (
        (existingQuiz.maxAttemptsPerUser === null ||
          existingQuiz.maxAttemptsPerUser === undefined) ||
        nextRecurringType === RecurringType.NONE
      ) {
        updateData.attemptResetPeriod = PrismaAttemptResetPeriod.NEVER;
      } else {
        updateData.attemptResetPeriod = toPrismaAttemptResetPeriod(
          validatedData.attemptResetPeriod
        );
      }
    }

    if (validatedData.recurringType !== undefined && nextRecurringType === RecurringType.NONE) {
      updateData.attemptResetPeriod = PrismaAttemptResetPeriod.NEVER;
    }

    // Handle Grid questions if playMode is GRID_3X3
    if (validatedData.playMode === "GRID_3X3" && validatedData.playConfig) {
      const config = validatedData.playConfig as any;
      const { rows, cols, cells } = config;

      // Ensure we have a topic for these questions
      let topic = await prisma.topic.findFirst({
        where: { name: { equals: validatedData.sport || "General", mode: "insensitive" } }
      });

      if (!topic) {
        topic = await prisma.topic.findFirst(); // Fallback to first topic if nothing else
      }

      if (!topic) {
        throw new Error("No topics found in database. Please create a topic first.");
      }

      // Generate 9 grid questions
      const gridQuestionsData: { row: string; col: string; acceptedAnswers: string[]; order: number }[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const acceptedAnswers = (cells[r][c] || "")
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean);

          gridQuestionsData.push({
            row: rows[r],
            col: cols[c],
            acceptedAnswers,
            order: r * 3 + c,
          });
        }
      }

      // Perform in a transaction to update quiz AND questions
      const finalQuiz = await prisma.$transaction(async (tx) => {
        // 1. Update the quiz metadata first
        const updatedQuiz = await tx.quiz.update({
          where: { id },
          data: updateData,
        });

        // 2. Delete existing question pool entries for this quiz if it's changing to grid mode
        // Or just always refresh them for grid mode to be safe
        await tx.quizQuestionPool.deleteMany({
          where: { quizId: id }
        });

        // 3. Create/re-create the 9 questions and link them to the quiz
        // Create new questions and pool entries in parallel
        await Promise.all(gridQuestionsData.map(async (qEntry) => {
          const question = await tx.question.create({
            data: {
              type: "FILL_BLANK",
              topicId: topic!.id,
              difficulty: validatedData.difficulty || "MEDIUM",
              questionText: `Played for: ${qEntry.row} AND ${qEntry.col}`,
              answers: {
                create: qEntry.acceptedAnswers.map((text: string, idx: number) => ({
                  answerText: text,
                  isCorrect: true,
                  displayOrder: idx,
                }))
              }
            }
          });

          await tx.quizQuestionPool.create({
            data: {
              quizId: id,
              questionId: question.id,
              order: qEntry.order,
              points: 1,
            }
          });
        }));

        return updatedQuiz;
      });

      const isNowSitemapEligible = isSitemapEligible(finalQuiz.isPublished, finalQuiz.status);
      if (wasSitemapEligible !== isNowSitemapEligible || (isNowSitemapEligible && finalQuiz.slug !== existingQuiz.slug)) {
        revalidatePath("/sitemap.xml");
      }

      return successResponse(finalQuiz);
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            questionPool: true,
            attempts: true,
          },
        },
      },
    });

    const isNowSitemapEligible = isSitemapEligible(quiz.isPublished, quiz.status);
    if (wasSitemapEligible !== isNowSitemapEligible || (isNowSitemapEligible && quiz.slug !== existingQuiz.slug)) {
      revalidatePath("/sitemap.xml");
    }

    return successResponse(quiz);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/quizzes/[id] - Delete quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    const wasSitemapEligible = isSitemapEligible(quiz.isPublished, quiz.status);

    // Soft delete by archiving
    await prisma.quiz.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        isPublished: false,
      },
    });

    if (wasSitemapEligible) {
      revalidatePath("/sitemap.xml");
    }

    return successResponse({ message: "Quiz archived successfully" });
  } catch (error) {
    return handleError(error);
  }
}
