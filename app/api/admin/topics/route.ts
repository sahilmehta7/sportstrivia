import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { z } from "zod";

const topicSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
});

// GET /api/admin/topics - List all topics with advanced options
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const includeChildren = searchParams.get("includeChildren") === "true";
    const flat = searchParams.get("flat") === "true";
    const search = searchParams.get("search") || "";

    // Build where clause
    const where: any = {};

    // Parent filter
    if (parentId === "null" || parentId === "root") {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get topics
    const topics = await prisma.topic.findMany({
      where,
      orderBy: flat ? [{ level: "asc" }, { name: "asc" }] : { name: "asc" },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        ...(includeChildren && {
          children: {
            orderBy: { name: "asc" },
            include: {
              _count: {
                select: {
                  questions: true,
                },
              },
            },
          },
        }),
        _count: {
          select: {
            questions: true,
            children: true,
            quizTopicConfigs: true,
          },
        },
      },
    });

    return successResponse({ topics, total: topics.length });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/topics - Create new topic
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validatedData = topicSchema.parse(body);

    // Check if slug already exists
    const slugExists = await prisma.topic.findUnique({
      where: { slug: validatedData.slug },
    });

    if (slugExists) {
      throw new BadRequestError("A topic with this slug already exists");
    }

    // Check if name already exists
    const nameExists = await prisma.topic.findFirst({
      where: { name: validatedData.name },
    });

    if (nameExists) {
      throw new BadRequestError("A topic with this name already exists");
    }

    // Calculate level based on parent
    let level = 0;
    if (validatedData.parentId) {
      const parent = await prisma.topic.findUnique({
        where: { id: validatedData.parentId },
      });
      if (parent) {
        level = parent.level + 1;
      } else {
        throw new NotFoundError("Parent topic not found");
      }
    }

    const topic = await prisma.topic.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        parentId: validatedData.parentId,
        level,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            questions: true,
            children: true,
          },
        },
      },
    });

    return successResponse(topic, 201);
  } catch (error) {
    return handleError(error);
  }
}
