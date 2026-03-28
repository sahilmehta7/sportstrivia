import { prisma } from "@/lib/db";
import {
  AdminBackgroundTask,
  BackgroundTaskStatus,
  BackgroundTaskType,
} from "@prisma/client";
import { NotFoundError, ServiceUnavailableError } from "@/lib/errors";

export interface CreateBackgroundTaskInput {
  userId?: string | null;
  type: BackgroundTaskType;
  label: string;
  input?: unknown;
  status?: BackgroundTaskStatus;
}

export interface TaskExecutionContext {
  taskId: string;
  attempt: number;
}

interface UpdateTaskInput {
  status?: BackgroundTaskStatus;
  result?: unknown;
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  cancelledAttempt?: number | null;
}

interface TransitionGuard {
  attempt?: number;
  allowedStatuses?: BackgroundTaskStatus[];
  blockIfCancelledAttempt?: boolean;
}

let cachedEnumValues: Set<string> | null = null;
let enumCacheAt = 0;
const ENUM_CACHE_TTL_MS = 60_000;

async function getDbBackgroundTaskEnumValues(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedEnumValues && now - enumCacheAt < ENUM_CACHE_TTL_MS) {
    return cachedEnumValues;
  }

  type EnumRow = { value: string };
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT unnest(enum_range(NULL::"BackgroundTaskType"))::text AS value`
  )) as EnumRow[];
  cachedEnumValues = new Set(rows.map((row) => row.value));
  enumCacheAt = now;
  return cachedEnumValues;
}

function getFallbackTaskType(type: BackgroundTaskType): BackgroundTaskType {
  if (type === BackgroundTaskType.BACKUP_CREATE || type === BackgroundTaskType.BACKUP_RESTORE) {
    return BackgroundTaskType.AI_QUIZ_IMPORT;
  }
  return type;
}

async function normalizeTaskTypeForDatabase(type: BackgroundTaskType): Promise<BackgroundTaskType> {
  try {
    const values = await getDbBackgroundTaskEnumValues();
    if (values.has(type)) {
      return type;
    }

    const fallback = getFallbackTaskType(type);
    if (values.has(fallback)) {
      console.warn(
        `[BackgroundTask] DB enum missing "${type}". Using fallback "${fallback}". Run migrations to add missing enum values.`
      );
      return fallback;
    }

    if (type === BackgroundTaskType.TOPIC_TYPE_APPLY) {
      throw new ServiceUnavailableError(
        'Topic type apply is temporarily unavailable because database enum "BackgroundTaskType" is missing "TOPIC_TYPE_APPLY".'
      );
    }
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw error;
    }

    if (type === BackgroundTaskType.TOPIC_TYPE_APPLY) {
      throw new ServiceUnavailableError(
        "Topic type apply is temporarily unavailable because task type support could not be verified."
      );
    }

    const fallback = getFallbackTaskType(type);
    console.warn(
      `[BackgroundTask] Could not verify DB enum values for "${type}". Falling back to "${fallback}".`,
      error
    );
    return fallback;
  }

  return type;
}

async function guardedUpdateTask(
  id: string,
  data: UpdateTaskInput,
  guard: TransitionGuard = {}
): Promise<AdminBackgroundTask | null> {
  const { attempt, allowedStatuses, blockIfCancelledAttempt = true } = guard;
  const where: any = { id };
  if (attempt !== undefined) {
    where.attempt = attempt;
    if (blockIfCancelledAttempt) {
      where.OR = [
        { cancelledAttempt: null },
        { cancelledAttempt: { not: attempt } },
      ];
    }
  }
  if (allowedStatuses?.length) {
    where.status = { in: allowedStatuses };
  }

  const updated = await prisma.adminBackgroundTask.updateMany({
    where,
    data: {
      status: data.status,
      result: data.result ?? undefined,
      errorMessage: data.errorMessage ?? undefined,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      cancelledAt: data.cancelledAt,
      cancelledAttempt: data.cancelledAttempt,
    },
  });

  if (updated.count === 0) {
    return null;
  }
  return prisma.adminBackgroundTask.findUnique({ where: { id } });
}

export async function createBackgroundTask({
  userId,
  type,
  label,
  input,
  status = BackgroundTaskStatus.PENDING,
}: CreateBackgroundTaskInput): Promise<AdminBackgroundTask> {
  const normalizedType = await normalizeTaskTypeForDatabase(type);
  return prisma.adminBackgroundTask.create({
    data: {
      userId: userId ?? null,
      type: normalizedType,
      status,
      label,
      input: input ?? undefined,
      attempt: 1,
      cancelledAttempt: null,
      cancelledAt: null,
    },
  });
}

export async function updateBackgroundTask(
  id: string,
  input: UpdateTaskInput,
  guard: TransitionGuard = {}
): Promise<AdminBackgroundTask | null> {
  return guardedUpdateTask(id, input, guard);
}

export async function markBackgroundTaskInProgress(
  id: string,
  attempt?: number
): Promise<AdminBackgroundTask | null> {
  return guardedUpdateTask(
    id,
    {
      status: BackgroundTaskStatus.IN_PROGRESS,
      startedAt: new Date(),
      completedAt: null,
      errorMessage: null,
    },
    {
      attempt,
      allowedStatuses: [BackgroundTaskStatus.PENDING, BackgroundTaskStatus.IN_PROGRESS],
    }
  );
}

export async function markBackgroundTaskCompleted(
  id: string,
  result: unknown,
  attempt?: number
): Promise<AdminBackgroundTask | null> {
  return guardedUpdateTask(
    id,
    {
      status: BackgroundTaskStatus.COMPLETED,
      result,
      completedAt: new Date(),
    },
    {
      attempt,
      allowedStatuses: [BackgroundTaskStatus.IN_PROGRESS, BackgroundTaskStatus.PENDING],
    }
  );
}

export async function markBackgroundTaskFailed(
  id: string,
  errorMessage: string,
  result?: unknown,
  attempt?: number
): Promise<AdminBackgroundTask | null> {
  return guardedUpdateTask(
    id,
    {
      status: BackgroundTaskStatus.FAILED,
      errorMessage,
      result,
      completedAt: new Date(),
    },
    {
      attempt,
      allowedStatuses: [BackgroundTaskStatus.IN_PROGRESS, BackgroundTaskStatus.PENDING],
    }
  );
}

export async function cancelBackgroundTask(
  id: string,
  expectedAttempt?: number
): Promise<AdminBackgroundTask | null> {
  const task = await getBackgroundTaskById(id);
  if (!task) return null;

  const attempt = expectedAttempt ?? (task as any).attempt ?? 1;
  return guardedUpdateTask(
    id,
    {
      status: BackgroundTaskStatus.CANCELLED,
      errorMessage: "Cancelled by user",
      completedAt: new Date(),
      cancelledAt: new Date(),
      cancelledAttempt: attempt,
    },
    {
      attempt,
      allowedStatuses: [BackgroundTaskStatus.PENDING, BackgroundTaskStatus.IN_PROGRESS],
      blockIfCancelledAttempt: false,
    }
  );
}

export async function restartBackgroundTask(
  id: string
): Promise<AdminBackgroundTask> {
  await prisma.adminBackgroundTask.update({
    where: { id },
    data: {
      status: BackgroundTaskStatus.PENDING,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      attempt: { increment: 1 },
      cancelledAttempt: null,
      cancelledAt: null,
      result: undefined,
    },
  });
  const refreshed = await prisma.adminBackgroundTask.findUnique({ where: { id } });
  if (!refreshed) {
    throw new NotFoundError("Task not found");
  }
  return refreshed;
}

export async function getBackgroundTaskById(id: string): Promise<AdminBackgroundTask | null> {
  return prisma.adminBackgroundTask.findUnique({ where: { id } });
}

export async function getOwnedBackgroundTaskOrThrow(
  id: string,
  userId: string
): Promise<AdminBackgroundTask> {
  const task = await prisma.adminBackgroundTask.findUnique({ where: { id } });
  if (!task || (task.userId && task.userId !== userId)) {
    throw new NotFoundError("Task not found");
  }
  return task;
}

export async function getCurrentTaskExecutionContext(
  id: string
): Promise<TaskExecutionContext | null> {
  const task = await getBackgroundTaskById(id);
  if (!task) return null;
  return { taskId: task.id, attempt: (task as any).attempt ?? 1 };
}

export async function shouldStopTaskExecution(
  id: string,
  attempt: number
): Promise<boolean> {
  const task = await getBackgroundTaskById(id);
  if (!task) return true;
  const taskAttempt = (task as any).attempt ?? 1;
  const cancelledAttempt = (task as any).cancelledAttempt ?? null;
  if (taskAttempt !== attempt) return true;
  if (cancelledAttempt === attempt) return true;
  if (task.status === BackgroundTaskStatus.CANCELLED) return true;
  return false;
}

export async function listBackgroundTasksForUser(
  userId?: string | null,
  options: {
    types?: BackgroundTaskType[];
    take?: number;
    skip?: number;
    includeResult?: boolean;
  } = {}
): Promise<AdminBackgroundTask[]> {
  const { types, take = 50, skip = 0, includeResult = false } = options;

  if (includeResult) {
    return prisma.adminBackgroundTask.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(types?.length ? { type: { in: types } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
  }

  return prisma.adminBackgroundTask.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(types?.length ? { type: { in: types } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      attempt: true,
      cancelledAt: true,
      cancelledAttempt: true,
      label: true,
      input: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  }) as Promise<AdminBackgroundTask[]>;
}

export async function updateTaskProgress(
  id: string,
  progress: { percentage: number; status: string },
  attempt?: number
): Promise<void> {
  const task = await getBackgroundTaskById(id);
  if (!task) {
    console.warn(`[BackgroundTask] Task ${id} not found for progress update`);
    return;
  }
  if (attempt !== undefined && ((task as any).attempt ?? 1) !== attempt) {
    return;
  }
  if (attempt !== undefined && (task as any).cancelledAttempt === attempt) {
    return;
  }

  const currentResult = (task.result as any) || {};
  await guardedUpdateTask(
    id,
    {
      result: {
        ...currentResult,
        progress,
      },
    },
    {
      attempt,
      allowedStatuses: [BackgroundTaskStatus.PENDING, BackgroundTaskStatus.IN_PROGRESS],
    }
  );
}
