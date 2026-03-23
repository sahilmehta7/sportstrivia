import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { NotFoundError, handleError, successResponse } from "@/lib/errors";
import { validateTopicRelation, type TopicRelationTypeValue } from "@/lib/topic-graph/topic-readiness.service";
import { z } from "zod";

const relationSchema = z.object({
  toTopicId: z.string().min(1),
  relationType: z.custom<TopicRelationTypeValue>(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const relations = await prisma.topicRelation.findMany({
      where: {
        OR: [{ fromTopicId: id }, { toTopicId: id }],
      },
    });

    return successResponse({ relations });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = relationSchema.parse(await request.json());

    const fromTopic = await prisma.topic.findUnique({
      where: { id },
      select: { id: true, schemaType: true },
    });

    if (!fromTopic) {
      throw new NotFoundError("Topic not found");
    }

    const toTopic = await prisma.topic.findUnique({
      where: { id: body.toTopicId },
      select: { id: true, schemaType: true },
    });

    if (!toTopic) {
      throw new NotFoundError("Related topic not found");
    }

    validateTopicRelation({
      fromTopicId: fromTopic.id,
      toTopicId: toTopic.id,
      fromSchemaType: fromTopic.schemaType,
      toSchemaType: toTopic.schemaType,
      relationType: body.relationType,
    });

    const relation = await prisma.topicRelation.create({
      data: {
        fromTopicId: fromTopic.id,
        toTopicId: toTopic.id,
        relationType: body.relationType,
      },
    });

    return successResponse(relation, 201);
  } catch (error) {
    return handleError(error);
  }
}
