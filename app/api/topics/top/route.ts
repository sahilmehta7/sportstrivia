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
      include: {
        _count: {
          select: {
            quizTopicConfigs: true,
            children: true,
          },
        },
      },
    });

    const topicIds = topics.map((topic) => topic.id);

    const [childCounts, userCounts] = await Promise.all([
      prisma.topic.findMany({
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
      }),
      prisma.userTopicStats.groupBy({
        by: ["topicId"],
        where: {
          topicId: { in: topicIds },
        },
        _sum: {
          questionsAnswered: true,
        },
        _count: {
          topicId: true,
        },
      }),
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

    const userCountMap = new Map<string, number>();
    for (const aggregate of userCounts) {
      const totalUsers = aggregate._count.topicId;
      userCountMap.set(aggregate.topicId, totalUsers);
    }

    const sortedTopics = [...topics]
      .map((topic) => {
        const totalQuizCount = quizCountMap.get(topic.id) ?? 0;
        const totalUserCount = userCountMap.get(topic.id) ?? 0;

        return {
          id: topic.id,
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
          imageUrl: null,
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
