import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { z } from "zod";
import { isFollowableTopicSchemaType } from "@/lib/services/interest-profile.service";

const interestsUpdateSchema = z.object({
  interests: z.array(
    z.object({
      topicId: z.string().min(1),
      source: z.enum(["ONBOARDING", "PROFILE", "ADMIN", "IMPORT"]),
      strength: z.number().min(0).max(1).or(z.number().max(100)),
    })
  ),
  preferences: z.object({
    preferredDifficulty: z.enum(["EASY", "MEDIUM", "HARD"]).nullable(),
    preferredPlayModes: z.array(z.enum(["STANDARD", "GRID_3X3"])),
  }),
});

export async function GET() {
  try {
    const user = await requireAuth();

    const [interests, preferences] = await Promise.all([
      prisma.userInterestPreference.findMany({
        where: { userId: user.id },
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
              schemaType: true,
            },
          },
        },
        orderBy: [{ strength: "desc" }, { createdAt: "asc" }],
      }),
      prisma.userDiscoveryPreference.findUnique({
        where: { userId: user.id },
      }),
    ]);

    return successResponse({
      interests,
      preferences: preferences ?? {
        preferredDifficulty: null,
        preferredPlayModes: [],
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = interestsUpdateSchema.parse(await request.json());
    const requestedTopicIds = Array.from(new Set(body.interests.map((interest) => interest.topicId)));
    const availableTopics =
      requestedTopicIds.length === 0
        ? []
        : await prisma.topic.findMany({
            where: {
              id: { in: requestedTopicIds },
            },
            select: {
              id: true,
              schemaType: true,
            },
          });

    const validTopicIds = new Set(
      availableTopics
        .filter((topic) => isFollowableTopicSchemaType(topic.schemaType))
        .map((topic) => topic.id)
    );

    const savedInterests = body.interests
      .filter((interest, index, collection) => {
        return collection.findIndex((entry) => entry.topicId === interest.topicId) === index;
      })
      .filter((interest) => validTopicIds.has(interest.topicId))
      .map((interest) => ({
        userId: user.id,
        topicId: interest.topicId,
        source: "PROFILE" as const,
        strength: interest.strength,
      }));
    const droppedTopicIds = requestedTopicIds.filter((topicId) => !validTopicIds.has(topicId));

    await prisma.$transaction(async (tx) => {
      await tx.userInterestPreference.deleteMany({
        where: { userId: user.id },
      });

      if (savedInterests.length > 0) {
        await tx.userInterestPreference.createMany({
          data: savedInterests,
        });
      }

      await tx.userDiscoveryPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          preferredDifficulty: body.preferences.preferredDifficulty,
          preferredPlayModes: body.preferences.preferredPlayModes,
        },
        update: {
          preferredDifficulty: body.preferences.preferredDifficulty,
          preferredPlayModes: body.preferences.preferredPlayModes,
        },
      });
    });

    return successResponse({
      message: "Interests updated successfully",
      savedInterests: savedInterests.map((interest) => ({
        topicId: interest.topicId,
        source: interest.source,
        strength: interest.strength,
      })),
      droppedTopicIds,
    });
  } catch (error) {
    return handleError(error);
  }
}
