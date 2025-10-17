import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { Difficulty } from "@prisma/client";

const addTopicConfigSchema = z.object({
  topicId: z.string().cuid(),
  difficulty: z.nativeEnum(Difficulty),
  questionCount: z.number().int().min(1),
});

const updateTopicConfigSchema = z.object({
  difficulty: z.nativeEnum(Difficulty).optional(),
  questionCount: z.number().int().min(1).optional(),
});

// GET /api/admin/quizzes/[id]/topics - Get topic configurations for quiz
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { 
        id: true, 
        title: true,
        questionSelectionMode: true,
      },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    // Get topic configurations
    const topicConfigs = await prisma.quizTopicConfig.findMany({
      where: { quizId: id },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse({
      quiz,
      topicConfigs,
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/quizzes/[id]/topics - Add topic configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { topicId, difficulty, questionCount } = addTopicConfigSchema.parse(body);

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundError("Topic not found");
    }

    // Check if topic with this difficulty is already configured for this quiz
    const existing = await prisma.quizTopicConfig.findFirst({
      where: {
        quizId: id,
        topicId,
        difficulty,
      },
    });

    if (existing) {
      throw new BadRequestError("This topic with this difficulty level is already configured for this quiz");
    }

    // Create topic configuration
    const topicConfig = await prisma.quizTopicConfig.create({
      data: {
        quizId: id,
        topicId,
        difficulty,
        questionCount,
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            level: true,
          },
        },
      },
    });

    return successResponse(topicConfig, 201);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/quizzes/[id]/topics/[configId] - Update topic configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get("configId");

    if (!configId) {
      throw new BadRequestError("Config ID is required");
    }

    const body = await request.json();
    const { difficulty, questionCount } = updateTopicConfigSchema.parse(body);

    // Check if config exists
    const config = await prisma.quizTopicConfig.findUnique({
      where: { id: configId },
    });

    if (!config || config.quizId !== id) {
      throw new NotFoundError("Topic configuration not found");
    }

    // Update configuration
    const updated = await prisma.quizTopicConfig.update({
      where: { id: configId },
      data: {
        ...(difficulty && { difficulty }),
        ...(questionCount && { questionCount }),
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            level: true,
          },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/quizzes/[id]/topics - Remove topic configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get("configId");

    if (!configId) {
      throw new BadRequestError("Config ID is required");
    }

    // Check if config exists
    const config = await prisma.quizTopicConfig.findUnique({
      where: { id: configId },
    });

    if (!config || config.quizId !== id) {
      throw new NotFoundError("Topic configuration not found");
    }

    // Delete configuration
    await prisma.quizTopicConfig.delete({
      where: { id: configId },
    });

    return successResponse({ message: "Topic configuration removed" });
  } catch (error) {
    return handleError(error);
  }
}

