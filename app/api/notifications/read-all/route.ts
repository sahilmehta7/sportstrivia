import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { markAllNotificationsAsRead } from "@/lib/services/notification.service";

// PATCH /api/notifications/read-all - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();

    const count = await markAllNotificationsAsRead(user.id);

    return successResponse({
      message: `Marked ${count} notifications as read`,
      count,
    });
  } catch (error) {
    return handleError(error);
  }
}

