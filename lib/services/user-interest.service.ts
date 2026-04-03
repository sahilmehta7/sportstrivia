import { prisma } from "@/lib/db";
import type { Difficulty, InterestPreferenceSource, PlayMode } from "@prisma/client";
import { isFollowableTopicSchemaType } from "@/lib/topic-followability";
import { invalidateInterestProfileCache } from "@/lib/services/interest-profile.service";
import { BadRequestError } from "@/lib/errors";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";

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

export type FollowableTopic = {
  id: string;
  slug: string;
  name: string;
  schemaType: TopicSchemaTypeValue;
  entityStatus: string;
};

const GROUP_BY_SCHEMA_TYPE: Record<
  Exclude<TopicSchemaTypeValue, "NONE">,
  "sports" | "teams" | "athletes" | "events" | "organizations"
> = {
  SPORT: "sports",
  SPORTS_TEAM: "teams",
  ATHLETE: "athletes",
  SPORTS_EVENT: "events",
  SPORTS_ORGANIZATION: "organizations",
};

export async function assertEligibleInterestTopic(topicId: string): Promise<FollowableTopic> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      slug: true,
      name: true,
      schemaType: true,
      entityStatus: true,
    },
  });

  if (!topic) {
    throw new BadRequestError("Topic not found");
  }

  if (!isFollowableTopicSchemaType(topic.schemaType)) {
    throw new BadRequestError("Topic is not followable");
  }
  if (topic.entityStatus !== "READY") {
    throw new BadRequestError("Topic is not ready to follow");
  }

  return topic;
}

export async function addInterestTopic(
  userId: string,
  topicId: string,
  source: InterestPreferenceSource = "PROFILE",
  strength = 1
) {
  const topic = await assertEligibleInterestTopic(topicId);

  await prisma.userInterestPreference.upsert({
    where: {
      userId_topicId: {
        userId,
        topicId: topic.id,
      },
    },
    update: {
      source,
      strength,
      updatedAt: new Date(),
    },
    create: {
      userId,
      topicId: topic.id,
      source,
      strength,
    },
  });

  invalidateInterestProfileCache(userId);

  return {
    following: true,
    topicId: topic.id,
  };
}

export async function removeInterestTopic(userId: string, topicId: string) {
  await prisma.userInterestPreference.deleteMany({
    where: {
      userId,
      topicId,
    },
  });

  invalidateInterestProfileCache(userId);

  return {
    following: false,
    topicId,
  };
}

export async function listDerivedFollowsForUser(userId: string) {
  const interests = await prisma.userInterestPreference.findMany({
    where: { userId },
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          slug: true,
          schemaType: true,
          entityStatus: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const flat = interests.filter((interest) =>
    isFollowableTopicSchemaType(interest.topic.schemaType)
  );

  const grouped = {
    sports: [] as typeof flat,
    teams: [] as typeof flat,
    athletes: [] as typeof flat,
    events: [] as typeof flat,
    organizations: [] as typeof flat,
  };

  for (const interest of flat) {
    if (!isFollowableTopicSchemaType(interest.topic.schemaType)) continue;
    const bucket = GROUP_BY_SCHEMA_TYPE[interest.topic.schemaType];
    grouped[bucket].push(interest);
  }

  return {
    grouped,
    flat,
  };
}

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
            entityStatus: true,
          },
        });

  const byId = new Map(availableTopics.map((topic) => [topic.id, topic]));
  const invalidTopicIds = uniqueRequestedTopicIds.filter((topicId) => {
    const topic = byId.get(topicId);
    if (!topic) return true;
    if (!isFollowableTopicSchemaType(topic.schemaType)) return true;
    if (topic.entityStatus !== "READY") return true;
    return false;
  });

  if (invalidTopicIds.length > 0) {
    throw new BadRequestError(
      "One or more topics are not eligible for interests (must be followable and READY)"
    );
  }

  const strength = input.defaultStrength ?? 1;

  const savedTopicIds = uniqueRequestedTopicIds;

  await prisma.$transaction(async (tx) => {
    await tx.userInterestPreference.deleteMany({
      where: {
        userId: input.userId,
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
    droppedTopicIds: [],
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
            entityStatus: true,
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
