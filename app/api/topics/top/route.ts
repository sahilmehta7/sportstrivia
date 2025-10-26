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

    let topics;

    if (sortBy === "users") {
      // Sort by number of users who attempted quizzes in this topic in the last 30 days
      topics = await prisma.topic.findMany({
        where: {
          parentId: null, // Only top-level topics
          topicConfigs: {
            some: {
              quiz: {
                attempts: {
                  some: {
                    createdAt: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    },
                  },
                },
              },
            },
          },
        },
        include: {
          topicConfigs: {
            include: {
              quiz: {
                include: {
                  attempts: {
                    where: {
                      createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                      },
                    },
                    select: {
                      userId: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          topicConfigs: {
            _count: "desc",
          },
        },
        take: limit,
      });

      // Process the data to count unique users per topic
      topics = topics.map((topic) => {
        const uniqueUsers = new Set();
        topic.topicConfigs.forEach((config) => {
          config.quiz.attempts.forEach((attempt) => {
            uniqueUsers.add(attempt.userId);
          });
        });

        return {
          id: topic.id,
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
          imageUrl: topic.imageUrl,
          userCount: uniqueUsers.size,
          quizCount: topic.topicConfigs.length,
        };
      });

      // Sort by user count
      topics.sort((a, b) => b.userCount - a.userCount);
    } else {
      // Sort by number of quizzes available
      topics = await prisma.topic.findMany({
        where: {
          parentId: null, // Only top-level topics
        },
        include: {
          _count: {
            select: {
              topicConfigs: true,
            },
          },
        },
        orderBy: {
          topicConfigs: {
            _count: "desc",
          },
        },
        take: limit,
      });

      // Process the data
      topics = topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        imageUrl: topic.imageUrl,
        userCount: 0, // Not calculated for quiz-based sorting
        quizCount: topic._count.topicConfigs,
      }));
    }

    return NextResponse.json({
      topics,
      sortBy,
      limit,
      total: topics.length,
    });
  } catch (error) {
    console.error("Error fetching top quiz topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch top quiz topics" },
      { status: 500 }
    );
  }
}
