import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  parseTopicEntityData,
  requiresCanonicalUrl,
  sanitizeUrlList,
} from "@/lib/topic-schema";
import { TOPIC_SCHEMA_TYPES, type TopicSchemaTypeValue } from "@/lib/topic-schema-options";
import { normalizeAlternateNames } from "@/lib/topic-graph/topic-readiness.service";
import { syncTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.persistence";

const topicSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  displayEmoji: z.string().max(8).optional().nullable(),
  displayImageUrl: z.string().url().optional().nullable(),
  schemaType: z.enum(TOPIC_SCHEMA_TYPES).optional().default("NONE"),
  schemaCanonicalUrl: z.string().url().optional().nullable(),
  schemaSameAs: z.array(z.string().url()).optional().default([]),
  alternateNames: z.array(z.string()).optional().default([]),
  schemaEntityData: z.record(z.any()).optional().nullable(),
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
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { alternateNames: { hasSome: [search] } },
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
    const schemaType = (validatedData.schemaType ?? "NONE") as TopicSchemaTypeValue;
    const schemaSameAs = sanitizeUrlList(validatedData.schemaSameAs);
    const alternateNames = normalizeAlternateNames(validatedData.name, validatedData.alternateNames);
    const schemaEntityData = parseTopicEntityData(schemaType, validatedData.schemaEntityData);
    const schemaEntityDataValue =
      schemaEntityData === null ? Prisma.JsonNull : (schemaEntityData as Prisma.InputJsonValue);
    const schemaCanonicalUrl = validatedData.schemaCanonicalUrl?.trim() || null;
    if (requiresCanonicalUrl(schemaType) && !schemaCanonicalUrl) {
      throw new BadRequestError("schemaCanonicalUrl is required when schemaType is not NONE");
    }

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
        displayEmoji: validatedData.displayEmoji ?? null,
        displayImageUrl: validatedData.displayImageUrl ?? null,
        parentId: validatedData.parentId,
        level,
        schemaType,
        schemaCanonicalUrl,
        schemaSameAs,
        alternateNames,
        seoKeywords: [],
        schemaEntityData: schemaEntityDataValue,
        entityStatus: "DRAFT",
        entityValidatedAt: null,
      },
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
          include: {
            _count: {
              select: {
                questions: true,
              },
            },
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

    const readiness = await syncTopicEntityReadiness(topic.id);

    return successResponse(
      {
        ...topic,
        entityStatus: readiness.entityStatus,
        entityValidatedAt: readiness.isReady ? new Date().toISOString() : null,
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
