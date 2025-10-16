import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { z } from "zod";

const topicUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
});

// GET /api/admin/topics/[id] - Get single topic
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
          },
        },
        _count: {
          select: {
            questions: true,
            children: true,
            quizTopicConfigs: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundError("Topic not found");
    }

    return successResponse(topic);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/topics/[id] - Update topic
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const validatedData = topicUpdateSchema.parse(body);

    // Check if topic exists
    const existingTopic = await prisma.topic.findUnique({
      where: { id },
    });

    if (!existingTopic) {
      throw new NotFoundError("Topic not found");
    }

    // If changing parent, calculate new level
    let level = existingTopic.level;
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId === null) {
        level = 0;
      } else {
        const newParent = await prisma.topic.findUnique({
          where: { id: validatedData.parentId },
        });
        if (newParent) {
          level = newParent.level + 1;
        }
      }

      // Check for circular references
      if (validatedData.parentId === id) {
        throw new Error("A topic cannot be its own parent");
      }

      // Check if new parent is not a descendant of this topic
      const descendants = await getDescendantTopics(id);
      if (descendants.some((d) => d.id === validatedData.parentId)) {
        throw new Error("Cannot set a descendant as parent (circular reference)");
      }
    }

    // Check slug uniqueness if changed
    if (validatedData.slug && validatedData.slug !== existingTopic.slug) {
      const slugExists = await prisma.topic.findUnique({
        where: { slug: validatedData.slug },
      });
      if (slugExists) {
        throw new Error("A topic with this slug already exists");
      }
    }

    // Update topic
    const topic = await prisma.topic.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.parentId !== undefined && { level }),
      },
      include: {
        parent: true,
        children: {
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            questions: true,
            children: true,
          },
        },
      },
    });

    // If level changed, update all descendants
    if (level !== existingTopic.level) {
      await updateDescendantLevels(id, level);
    }

    return successResponse(topic);
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/topics/[id] - Update topic (alias for PATCH)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

// DELETE /api/admin/topics/[id] - Delete topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
            children: true,
            quizTopicConfigs: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundError("Topic not found");
    }

    // Check if topic has questions
    if (topic._count.questions > 0) {
      return successResponse(
        {
          message: `Cannot delete topic. It has ${topic._count.questions} question(s). Please reassign questions first.`,
          canDelete: false,
        },
        400
      );
    }

    // Check if topic has children
    if (topic._count.children > 0) {
      return successResponse(
        {
          message: `Cannot delete topic. It has ${topic._count.children} sub-topic(s). Please delete or reassign sub-topics first.`,
          canDelete: false,
        },
        400
      );
    }

    // Check if topic is used in quiz configs
    if (topic._count.quizTopicConfigs > 0) {
      return successResponse(
        {
          message: `Cannot delete topic. It is used in ${topic._count.quizTopicConfigs} quiz configuration(s).`,
          canDelete: false,
        },
        400
      );
    }

    // Delete topic
    await prisma.topic.delete({
      where: { id },
    });

    return successResponse({ message: "Topic deleted successfully" });
  } catch (error) {
    return handleError(error);
  }
}

// Helper function to get all descendant topics
async function getDescendantTopics(parentId: string): Promise<any[]> {
  const children = await prisma.topic.findMany({
    where: { parentId },
  });

  const descendants = [...children];

  for (const child of children) {
    const childDescendants = await getDescendantTopics(child.id);
    descendants.push(...childDescendants);
  }

  return descendants;
}

// Helper function to update descendant levels when parent changes
async function updateDescendantLevels(parentId: string, parentLevel: number) {
  const children = await prisma.topic.findMany({
    where: { parentId },
  });

  for (const child of children) {
    const newLevel = parentLevel + 1;
    await prisma.topic.update({
      where: { id: child.id },
      data: { level: newLevel },
    });

    // Recursively update grandchildren
    await updateDescendantLevels(child.id, newLevel);
  }
}

