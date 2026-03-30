import { prisma } from "@/lib/db";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";
import { isFollowableTopicSchemaType } from "@/lib/topic-followability";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { invalidateInterestProfileCache } from "@/lib/services/interest-profile.service";
import { resolveTopicIdFromPathReference } from "@/lib/services/route-reference.service";

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

export async function assertFollowableTopic(topicId: string): Promise<FollowableTopic> {
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
    throw new NotFoundError("Topic not found");
  }

  if (!isFollowableTopicSchemaType(topic.schemaType)) {
    throw new BadRequestError("Topic is not followable");
  }
  if (topic.entityStatus !== "READY") {
    throw new BadRequestError("Topic is not ready to follow");
  }

  return topic;
}

export async function resolveTopicIdFromSlug(slug: string): Promise<string> {
  return resolveTopicIdFromPathReference(slug, { allowIdFallback: false });
}

export async function followTopicForUser(userId: string, topicId: string) {
  const topic = await assertFollowableTopic(topicId);

  await prisma.userFollowedTopic.upsert({
    where: {
      userId_topicId: {
        userId,
        topicId: topic.id,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      userId,
      topicId: topic.id,
    },
  });

  invalidateInterestProfileCache(userId);

  return {
    following: true,
    topicId: topic.id,
  };
}

export async function unfollowTopicForUser(userId: string, topicId: string) {
  await prisma.userFollowedTopic.deleteMany({
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

export async function listFollowedTopicsForUser(userId: string) {
  const follows = await prisma.userFollowedTopic.findMany({
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

  const grouped = {
    sports: [] as typeof follows,
    teams: [] as typeof follows,
    athletes: [] as typeof follows,
    events: [] as typeof follows,
    organizations: [] as typeof follows,
  };

  for (const follow of follows) {
    if (!isFollowableTopicSchemaType(follow.topic.schemaType)) continue;
    const bucket = GROUP_BY_SCHEMA_TYPE[follow.topic.schemaType];
    grouped[bucket].push(follow);
  }

  return {
    grouped,
    flat: follows,
  };
}
