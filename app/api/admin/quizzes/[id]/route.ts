import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { quizUpdateSchema } from "@/lib/validations/quiz.schema";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/seo-utils";

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
    
    // Convert null values to undefined for optional fields (Prisma sends null, schema expects undefined)
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === null ? undefined : value])
    );
    
    const validatedData = quizUpdateSchema.parse(cleanedBody);

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!existingQuiz) {
      throw new NotFoundError("Quiz not found");
    }

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

    // Soft delete by archiving
    await prisma.quiz.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        isPublished: false,
      },
    });

    return successResponse({ message: "Quiz archived successfully" });
  } catch (error) {
    return handleError(error);
  }
}

