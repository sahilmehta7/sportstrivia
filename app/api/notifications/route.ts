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

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const notificationId = searchParams.get("id");
    const deleteAll = searchParams.get("all") === "true";

    if (deleteAll) {
      // Delete all notifications for user
      const result = await prisma.notification.deleteMany({
        where: { userId: user.id },
      });
      return successResponse({
        message: `Deleted ${result.count} notifications`,
        deletedCount: result.count,
      });
    }

    if (notificationId) {
      // Delete single notification (must belong to user)
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: user.id,
        },
      });

      if (result.count === 0) {
        return successResponse({
          message: "Notification not found or already deleted",
          deletedCount: 0,
        });
      }

      return successResponse({
        message: "Notification deleted",
        deletedCount: 1,
      });
    }

    // No id or all flag provided
    return successResponse({
      error: "Specify notification id or all=true",
    }, 400);
  } catch (error) {
    return handleError(error);
  }
}
