import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "users";
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    // Validate sortBy parameter
    if (!["users", "quizzes"].includes(sortBy)) {
      return NextResponse.json(
        { error: "Invalid sortBy parameter. Must be 'users' or 'quizzes'" },
        { status: 400 }
      );
    }

    // Validate limit parameter
    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: "Invalid limit parameter. Must be between 1 and 20" },
        { status: 400 }
      );
    }

    const topics = await prisma.topic.findMany({
      where: {
        parentId: null,
      },
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

    const topicIds = topics.map((topic) => topic.id);
    // Get all child topic IDs for aggregating user stats
    const allChildTopicIds = topics.flatMap((topic) => 
      topic.children.map((child) => child.id)
    );
    const allTopicIds = [...topicIds, ...allChildTopicIds];

    // Build queries conditionally to handle empty arrays
    const [childCounts, userStatsByTopic] = await Promise.all([
      topicIds.length > 0
        ? prisma.topic.findMany({
            where: {
              parentId: { in: topicIds },
            },
            select: {
              parentId: true,
              _count: {
                select: {
                  quizTopicConfigs: true,
                },
              },
            },
          })
        : Promise.resolve([] as Array<{ parentId: string | null; _count: { quizTopicConfigs: number } }>),
      allTopicIds.length > 0
        ? prisma.userTopicStats.findMany({
            where: {
              topicId: { in: allTopicIds },
            },
            select: {
              topicId: true,
              userId: true,
            },
          })
        : Promise.resolve([] as Array<{ topicId: string; userId: string }>),
    ]);

    const quizCountMap = new Map<string, number>(
      topics.map((topic) => [topic.id, topic._count.quizTopicConfigs])
    );

    for (const child of childCounts) {
      if (!child.parentId) continue;
      const existing = quizCountMap.get(child.parentId) ?? 0;
      quizCountMap.set(
        child.parentId,
        existing + child._count.quizTopicConfigs
      );
    }

    // Create a map of child topic to parent topic ID
    const childToParentMap = new Map<string, string>();
    topics.forEach((topic) => {
      topic.children.forEach((child) => {
        childToParentMap.set(child.id, topic.id);
      });
    });

    // Aggregate unique users per parent topic
    // Count unique users per parent topic (rolling up child topic stats)
    const uniqueUsersByParent = new Map<string, Set<string>>();
    for (const stat of userStatsByTopic) {
      const topicId = stat.topicId;
      const parentId = childToParentMap.get(topicId) || topicId;
      if (!uniqueUsersByParent.has(parentId)) {
        uniqueUsersByParent.set(parentId, new Set());
      }
      uniqueUsersByParent.get(parentId)!.add(stat.userId);
    }

    // Convert sets to counts
    const finalUserCountMap = new Map<string, number>();
    for (const [parentId, userIds] of uniqueUsersByParent.entries()) {
      finalUserCountMap.set(parentId, userIds.size);
    }

    const sortedTopics = [...topics]
      .map((topic) => {
        const totalQuizCount = quizCountMap.get(topic.id) ?? 0;
        const totalUserCount = finalUserCountMap.get(topic.id) ?? 0;

        return {
          id: topic.id,
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
          imageUrl: topic.displayImageUrl,
          quizCount: totalQuizCount,
          userCount: totalUserCount,
        };
      })
      .filter((topic) => topic.quizCount > 0 || topic.userCount > 0)
      .sort((a, b) => {
        if (sortBy === "quizzes") {
          return b.quizCount - a.quizCount || b.userCount - a.userCount;
        }

        return b.userCount - a.userCount || b.quizCount - a.quizCount;
      })
      .slice(0, limit);

    return NextResponse.json({
      topics: sortedTopics,
      sortBy,
      limit,
      total: sortedTopics.length,
    });
  } catch (error) {
    console.error("Error fetching top quiz topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch top quiz topics" },
      { status: 500 }
    );
  }
}
