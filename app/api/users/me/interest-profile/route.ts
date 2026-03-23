import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { computeInterestProfile } from "@/lib/services/interest-profile.service";

export async function GET() {
  try {
    const user = await requireAuth();

    const [explicitInterests, follows, topicStats, preferences] = await Promise.all([
      prisma.userInterestPreference.findMany({
        where: { userId: user.id },
        include: {
          topic: {
            select: {
              id: true,
              slug: true,
              name: true,
              schemaType: true,
            },
          },
        },
      }),
      prisma.userFollowedTopic.findMany({
        where: { userId: user.id },
        include: {
          topic: {
            select: {
              id: true,
              slug: true,
              name: true,
              schemaType: true,
            },
          },
        },
      }),
      prisma.userTopicStats.findMany({
        where: { userId: user.id },
        include: {
          topic: {
            select: {
              id: true,
              slug: true,
              name: true,
              schemaType: true,
            },
          },
        },
      }),
      prisma.userDiscoveryPreference.findUnique({
        where: { userId: user.id },
      }),
    ]);

    const profile = computeInterestProfile({
      userId: user.id,
      explicitInterests: explicitInterests.map((entry) => ({
        topicId: entry.topic.id,
        slug: entry.topic.slug,
        name: entry.topic.name,
        schemaType: entry.topic.schemaType,
        source: entry.source,
        strength: entry.strength,
      })),
      follows: follows.map((entry) => ({
        topicId: entry.topic.id,
        slug: entry.topic.slug,
        name: entry.topic.name,
        schemaType: entry.topic.schemaType,
      })),
      topicStats: topicStats.map((entry) => ({
        topicId: entry.topic.id,
        slug: entry.topic.slug,
        name: entry.topic.name,
        schemaType: entry.topic.schemaType,
        questionsAnswered: entry.questionsAnswered,
        successRate: entry.successRate,
        lastAnsweredAt: entry.lastAnsweredAt?.toISOString() ?? null,
      })),
      searchSignals: [],
      preferences: {
        preferredDifficulty: preferences?.preferredDifficulty ?? null,
        preferredPlayModes: preferences?.preferredPlayModes ?? [],
      },
    });

    return successResponse(profile);
  } catch (error) {
    return handleError(error);
  }
}
