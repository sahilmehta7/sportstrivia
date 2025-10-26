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

    // Simplified query to test basic functionality
    const topics = await prisma.topic.findMany({
      where: {
        parentId: null, // Only top-level topics
      },
      take: limit,
    });

    // Process the data with mock counts for now
    const processedTopics = topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      imageUrl: null,
      userCount: Math.floor(Math.random() * 100), // Mock data for now
      quizCount: Math.floor(Math.random() * 20), // Mock data for now
    }));

    return NextResponse.json({
      topics: processedTopics,
      sortBy,
      limit,
      total: processedTopics.length,
    });
  } catch (error) {
    console.error("Error fetching top quiz topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch top quiz topics" },
      { status: 500 }
    );
  }
}
