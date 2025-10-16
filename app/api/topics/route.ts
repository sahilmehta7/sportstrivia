import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse } from "@/lib/errors";

// GET /api/topics - List all topics (public, for dropdown filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHierarchy = searchParams.get("hierarchy") === "true";

    if (includeHierarchy) {
      // Get full hierarchy tree
      const topics = await prisma.topic.findMany({
        where: { parentId: null },
        orderBy: { name: "asc" },
        include: {
          children: {
            orderBy: { name: "asc" },
            include: {
              children: {
                orderBy: { name: "asc" },
                include: {
                  _count: {
                    select: { questions: true },
                  },
                },
              },
              _count: {
                select: { questions: true },
              },
            },
          },
          _count: {
            select: { questions: true },
          },
        },
      });

      return successResponse({ topics });
    } else {
      // Get flat list
      const topics = await prisma.topic.findMany({
        orderBy: [{ level: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          parentId: true,
          _count: {
            select: { questions: true },
          },
        },
      });

      return successResponse({ topics });
    }
  } catch (error) {
    return handleError(error);
  }
}

