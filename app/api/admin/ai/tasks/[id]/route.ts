import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { getBackgroundTaskById } from "@/lib/services/background-task.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const task = await getBackgroundTaskById(id);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    if (task.userId && task.userId !== admin.id) {
      throw new NotFoundError("Task not found");
    }

    return successResponse({ task });
  } catch (error) {
    return handleError(error);
  }
}
