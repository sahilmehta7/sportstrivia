import { cache } from "react";
import { prisma } from "@/lib/db";
import type { FeaturedQuizSummary, TopicSummary } from "@/types/home";

export const getFeaturedQuizzes = cache(async (): Promise<FeaturedQuizSummary[]> => {
  const quizzes = await prisma.quiz.findMany({
    where: {
      isFeatured: true,
      isPublished: true,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      duration: true,
      isFeatured: true,
      descriptionImageUrl: true,
      _count: {
        select: {
          attempts: true,
        },
      },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 6,
  });

  return quizzes satisfies FeaturedQuizSummary[];
});

export const getTopTopics = cache(async (): Promise<TopicSummary[]> => {
  const limit = 6;
  const topics = await prisma.topic.findMany({
    where: { parentId: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      displayImageUrl: true,
      _count: {
        select: {
          quizTopicConfigs: true,
          children: true,
        },
      },
      children: {
        select: {
          id: true,
        },
      },
    },
  });

  if (topics.length === 0) {
    return [];
  }

  const topicIds = topics.map((topic) => topic.id);
  const childIds = topics.flatMap((topic) => topic.children.map((child) => child.id));
  const allTopicIds = [...topicIds, ...childIds];

  const [childCounts, userStatsByTopic] = await Promise.all([
    topicIds.length === 0
      ? []
      : prisma.topic.findMany({
          where: { parentId: { in: topicIds } },
          select: {
            parentId: true,
            _count: {
              select: { quizTopicConfigs: true },
            },
          },
        }),
    allTopicIds.length === 0
      ? []
      : prisma.userTopicStats.findMany({
          where: { topicId: { in: allTopicIds } },
          select: {
            topicId: true,
            userId: true,
          },
        }),
  ]);

  const quizCountMap = new Map<string, number>(
    topics.map((topic) => [topic.id, topic._count.quizTopicConfigs ?? 0]),
  );

  for (const child of childCounts) {
    if (!child.parentId) continue;
    const existing = quizCountMap.get(child.parentId) ?? 0;
    quizCountMap.set(child.parentId, existing + (child._count.quizTopicConfigs ?? 0));
  }

  const childToParentMap = new Map<string, string>();
  for (const topic of topics) {
    for (const child of topic.children) {
      childToParentMap.set(child.id, topic.id);
    }
  }

  const uniqueUsersByParent = new Map<string, Set<string>>();
  for (const stat of userStatsByTopic) {
    const parentId = childToParentMap.get(stat.topicId) ?? stat.topicId;
    if (!uniqueUsersByParent.has(parentId)) {
      uniqueUsersByParent.set(parentId, new Set());
    }
    uniqueUsersByParent.get(parentId)!.add(stat.userId);
  }

  const sortedTopics = topics
    .map<TopicSummary>((topic) => {
      const quizCount = quizCountMap.get(topic.id) ?? 0;
      const userCount = uniqueUsersByParent.get(topic.id)?.size ?? 0;

      return {
        id: topic.id,
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        imageUrl: topic.displayImageUrl,
        quizCount,
        userCount,
      };
    })
    .filter((topic) => topic.quizCount > 0 || topic.userCount > 0)
    .sort((a, b) => {
      const countDiff = b.userCount - a.userCount;
      if (countDiff !== 0) {
        return countDiff;
      }
      return b.quizCount - a.quizCount;
    })
    .slice(0, limit);

  return sortedTopics;
});

