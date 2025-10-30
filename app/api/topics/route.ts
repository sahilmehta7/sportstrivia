import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, successResponse } from "@/lib/errors";
import { searchTopics } from "@/lib/services/topic.service";

// GET /api/topics - List all topics (public, for dropdown filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "20", 10);
    const page = Number.isNaN(pageParam) ? 1 : Math.max(1, pageParam);
    const limit = Number.isNaN(limitParam) ? 20 : Math.max(1, limitParam);

    if (search) {
      const result = await searchTopics(
        {
          query: search,
          page,
          limit,
        },
        {
          telemetryEnabled: true,
        }
      );

      return successResponse(result);
    }

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
