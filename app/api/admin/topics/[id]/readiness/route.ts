import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { NotFoundError, handleError, successResponse } from "@/lib/errors";
import { evaluateTopicEntityReadiness } from "@/lib/topic-graph/topic-readiness.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      select: {
        id: true,
        schemaType: true,
        schemaCanonicalUrl: true,
        schemaEntityData: true,
        outgoingRelations: {
          select: {
            fromTopicId: true,
            toTopicId: true,
            relationType: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundError("Topic not found");
    }

    const readiness = evaluateTopicEntityReadiness({
      schemaType: topic.schemaType,
      schemaCanonicalUrl: topic.schemaCanonicalUrl,
      schemaEntityData:
        topic.schemaEntityData && typeof topic.schemaEntityData === "object"
          ? (topic.schemaEntityData as Record<string, unknown>)
          : null,
      relations: topic.outgoingRelations,
    });

    return successResponse(readiness);
  } catch (error) {
    return handleError(error);
  }
}
