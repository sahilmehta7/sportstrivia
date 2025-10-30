import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { listBackgroundTasksForUser } from "@/lib/services/background-task.service";
import { BackgroundTaskType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const url = new URL(request.url);

    const typeParams = url.searchParams.getAll("type");
    const takeParam = url.searchParams.get("take");

    const requestedTypes = typeParams
      .map((value) => {
        if (Object.values(BackgroundTaskType).includes(value as BackgroundTaskType)) {
          return value as BackgroundTaskType;
        }
        return null;
      })
      .filter((value): value is BackgroundTaskType => value !== null);

    const take = takeParam ? Math.min(Math.max(parseInt(takeParam, 10) || 20, 1), 200) : 50;

    const tasks = await listBackgroundTasksForUser(admin.id, {
      types: requestedTypes.length > 0 ? requestedTypes : undefined,
      take,
    });

    return successResponse({
      tasks: tasks.map((task) => ({
        id: task.id,
        label: task.label,
        type: task.type,
        status: task.status,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        errorMessage: task.errorMessage,
        lastUpdatedAt: task.updatedAt,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
