import { prisma } from "@/lib/db";
import {
  AdminBackgroundTask,
  BackgroundTaskStatus,
  BackgroundTaskType,
} from "@prisma/client";

export interface CreateBackgroundTaskInput {
  userId?: string | null;
  type: BackgroundTaskType;
  label: string;
  input?: unknown;
  status?: BackgroundTaskStatus;
}

export async function createBackgroundTask({
  userId,
  type,
  label,
  input,
  status = BackgroundTaskStatus.PENDING,
}: CreateBackgroundTaskInput): Promise<AdminBackgroundTask> {
  return prisma.adminBackgroundTask.create({
    data: {
      userId: userId ?? null,
      type,
      status,
      label,
      input: input ?? undefined,
    },
  });
}

interface UpdateTaskInput {
  status?: BackgroundTaskStatus;
  result?: unknown;
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

export async function updateBackgroundTask(
  id: string,
  { status, result, errorMessage, startedAt, completedAt }: UpdateTaskInput
): Promise<AdminBackgroundTask> {
  return prisma.adminBackgroundTask.update({
    where: { id },
    data: {
      status,
      result: result ?? undefined,
      errorMessage: errorMessage ?? undefined,
      startedAt,
      completedAt,
    },
  });
}

export async function markBackgroundTaskInProgress(id: string): Promise<AdminBackgroundTask> {
  return updateBackgroundTask(id, {
    status: BackgroundTaskStatus.IN_PROGRESS,
    startedAt: new Date(),
  });
}

export async function markBackgroundTaskCompleted(
  id: string,
  result: unknown
): Promise<AdminBackgroundTask> {
  return updateBackgroundTask(id, {
    status: BackgroundTaskStatus.COMPLETED,
    result,
    completedAt: new Date(),
  });
}

export async function markBackgroundTaskFailed(
  id: string,
  errorMessage: string,
  result?: unknown
): Promise<AdminBackgroundTask> {
  return updateBackgroundTask(id, {
    status: BackgroundTaskStatus.FAILED,
    errorMessage,
    result,
    completedAt: new Date(),
  });
}

export async function getBackgroundTaskById(id: string): Promise<AdminBackgroundTask | null> {
  return prisma.adminBackgroundTask.findUnique({ where: { id } });
}

export async function listBackgroundTasksForUser(
  userId?: string | null,
  options: {
    types?: BackgroundTaskType[];
    take?: number;
  } = {}
): Promise<AdminBackgroundTask[]> {
  const { types, take = 50 } = options;
  return prisma.adminBackgroundTask.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(types?.length ? { type: { in: types } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
