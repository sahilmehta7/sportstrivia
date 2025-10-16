import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { calculatePagination, buildPaginationResult } from "@/lib/dto/quiz-filters.dto";

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") || undefined;

    const { skip, take } = calculatePagination(page, limit);

    const where: any = {
      userId: user.id,
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: user.id,
          read: false,
        },
      }),
    ]);

    return successResponse({
      notifications,
      pagination: buildPaginationResult(page, limit, total),
      unreadCount,
    });
  } catch (error) {
    return handleError(error);
  }
}

