import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { BadRequestError, NotFoundError, handleError, successResponse } from "@/lib/errors";
import { isFollowableTopicSchemaType } from "@/lib/services/interest-profile.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        schemaType: true,
      },
    });

    if (!topic) {
      throw new NotFoundError("Topic not found");
    }

    if (!isFollowableTopicSchemaType(topic.schemaType)) {
      throw new BadRequestError("Topic is not followable");
    }

    await prisma.userFollowedTopic.upsert({
      where: {
        userId_topicId: {
          userId: user.id,
          topicId: topic.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        topicId: topic.id,
      },
    });

    return successResponse({ message: "Followed topic successfully" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await prisma.userFollowedTopic.deleteMany({
      where: {
        userId: user.id,
        topicId: id,
      },
    });

    return successResponse({ message: "Unfollowed topic successfully" });
  } catch (error) {
    return handleError(error);
  }
}
