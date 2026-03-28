import { prisma } from "@/lib/db";
import type { Difficulty, InterestPreferenceSource, PlayMode } from "@prisma/client";
import { isFollowableTopicSchemaType } from "@/lib/topic-followability";
import { invalidateInterestProfileCache } from "@/lib/services/interest-profile.service";

export type ReplaceUserInterestsInput = {
  userId: string;
  topicIds: string[];
  source: InterestPreferenceSource;
  preferences: {
    preferredDifficulty: Difficulty | null;
    preferredPlayModes: PlayMode[];
  };
  defaultStrength?: number;
};

export async function replaceUserInterestsBySource(input: ReplaceUserInterestsInput) {
  const uniqueRequestedTopicIds = Array.from(new Set(input.topicIds));

  const availableTopics =
    uniqueRequestedTopicIds.length === 0
      ? []
      : await prisma.topic.findMany({
          where: {
            id: { in: uniqueRequestedTopicIds },
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

  const strength = input.defaultStrength ?? 1;

  const savedTopicIds = uniqueRequestedTopicIds.filter((topicId) => validTopicIds.has(topicId));

  const droppedTopicIds = uniqueRequestedTopicIds.filter((topicId) => !validTopicIds.has(topicId));

  await prisma.$transaction(async (tx) => {
    await tx.userInterestPreference.deleteMany({
      where: {
        userId: input.userId,
        source: input.source,
        topicId: {
          notIn: savedTopicIds,
        },
      },
    });

    for (const topicId of savedTopicIds) {
      await tx.userInterestPreference.upsert({
        where: {
          userId_topicId: {
            userId: input.userId,
            topicId,
          },
        },
        update: {
          source: input.source,
          strength,
        },
        create: {
          userId: input.userId,
          topicId,
          source: input.source,
          strength,
        },
      });
    }

    await tx.userDiscoveryPreference.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        preferredDifficulty: input.preferences.preferredDifficulty,
        preferredPlayModes: input.preferences.preferredPlayModes,
      },
      update: {
        preferredDifficulty: input.preferences.preferredDifficulty,
        preferredPlayModes: input.preferences.preferredPlayModes,
      },
    });
  });

  invalidateInterestProfileCache(input.userId);

  return {
    savedInterests: savedTopicIds.map((topicId) => ({
      userId: input.userId,
      topicId,
      source: input.source,
      strength,
    })),
    droppedTopicIds,
  };
}

export async function getUserInterestsAndPreferences(userId: string) {
  const [interests, preferences] = await Promise.all([
    prisma.userInterestPreference.findMany({
      where: { userId },
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
      where: { userId },
    }),
  ]);

  return {
    interests,
    preferences: preferences ?? {
      preferredDifficulty: null,
      preferredPlayModes: [],
    },
  };
}
