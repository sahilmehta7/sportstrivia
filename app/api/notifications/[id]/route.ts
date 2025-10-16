import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError } from "@/lib/errors";

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    if (notification.userId !== user.id) {
      throw new ForbiddenError("You do not have access to this notification");
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return successResponse({ notification: updated });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    if (notification.userId !== user.id) {
      throw new ForbiddenError("You do not have access to this notification");
    }

    await prisma.notification.delete({
      where: { id },
    });

    return successResponse({ message: "Notification deleted successfully" });
  } catch (error) {
    return handleError(error);
  }
}

