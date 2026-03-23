import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, handleError, successResponse } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const topic = await prisma.topic.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        schemaType: true,
        outgoingRelations: {
          select: {
            id: true,
            relationType: true,
            toTopic: {
              select: {
                id: true,
                slug: true,
                name: true,
                schemaType: true,
              },
            },
          },
        },
        incomingRelations: {
          select: {
            id: true,
            relationType: true,
            fromTopic: {
              select: {
                id: true,
                slug: true,
                name: true,
                schemaType: true,
              },
            },
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundError("Topic not found");
    }

    const relations = [
      ...topic.outgoingRelations.map((relation) => ({
        id: relation.id,
        relationType: relation.relationType,
        direction: "outgoing" as const,
        relatedTopic: relation.toTopic,
      })),
      ...topic.incomingRelations.map((relation) => ({
        id: relation.id,
        relationType: relation.relationType,
        direction: "incoming" as const,
        relatedTopic: relation.fromTopic,
      })),
    ];

    return successResponse({
      topic: {
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        schemaType: topic.schemaType,
      },
      relations,
    });
  } catch (error) {
    return handleError(error);
  }
}
