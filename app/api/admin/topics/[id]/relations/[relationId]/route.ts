import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { NotFoundError, handleError, successResponse } from "@/lib/errors";
import { validateTopicRelation, type TopicRelationTypeValue } from "@/lib/topic-graph/topic-readiness.service";
import { syncTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.persistence";
import { z } from "zod";

const relationUpdateSchema = z.object({
  toTopicId: z.string().min(1),
  relationType: z.custom<TopicRelationTypeValue>(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; relationId: string }> }
) {
  try {
    await requireAdmin();
    const { id, relationId } = await params;
    const body = relationUpdateSchema.parse(await request.json());

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

    const relation = await prisma.topicRelation.update({
      where: { id: relationId },
      data: {
        toTopicId: toTopic.id,
        relationType: body.relationType,
      },
    });
    await syncTopicEntityReadiness(fromTopic.id);

    return successResponse(relation);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; relationId: string }> }
) {
  try {
    await requireAdmin();
    const { id, relationId } = await params;

    await prisma.topicRelation.delete({
      where: { id: relationId },
    });
    await syncTopicEntityReadiness(id);

    return successResponse({ message: "Relation deleted successfully" });
  } catch (error) {
    return handleError(error);
  }
}
