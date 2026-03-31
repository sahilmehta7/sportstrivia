import { prisma } from "@/lib/db";
import {
  AdminBackgroundTask,
  BackgroundTaskStatus,
  BackgroundTaskType,
} from "@prisma/client";
import { NotFoundError, ServiceUnavailableError } from "@/lib/errors";

type BackgroundTaskDbClient = {
  adminBackgroundTask: {
    create: (args: any) => Promise<AdminBackgroundTask>;
    update: (args: any) => Promise<AdminBackgroundTask>;
    updateMany: (args: any) => Promise<{ count: number }>;
    findUnique: (args: any) => Promise<AdminBackgroundTask | null>;
    findMany: (args: any) => Promise<AdminBackgroundTask[]>;
  };
};

interface BackgroundTaskScopeOptions {
  userId?: string | null;
  types?: BackgroundTaskType[];
  includeNullOwned?: boolean;
}

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
  const values = new Set(rows.map((row) => row.value));
  cachedEnumValues = values;
  enumCacheAt = now;
  return values;
}

function isBackupTaskType(type: BackgroundTaskType): boolean {
  return type === BackgroundTaskType.BACKUP_CREATE || type === BackgroundTaskType.BACKUP_RESTORE;
}

function buildEnumSupportErrorMessage(type: BackgroundTaskType): string {
  return `Background task type "${type}" is not available in database enum "BackgroundTaskType". Run migrations (for example: npx prisma migrate deploy) and retry.`;
}

async function normalizeTaskTypeForDatabase(
  type: BackgroundTaskType,
  _dbClient?: BackgroundTaskDbClient
): Promise<BackgroundTaskType> {
  try {
    const values = await getDbBackgroundTaskEnumValues();
    if (values.has(type)) {
      return type;
    }

    if (isBackupTaskType(type)) {
      throw new ServiceUnavailableError(buildEnumSupportErrorMessage(type));
    }

    if (type === BackgroundTaskType.TOPIC_TYPE_APPLY) {
      throw new ServiceUnavailableError(
        'Topic type apply is temporarily unavailable because database enum "BackgroundTaskType" is missing "TOPIC_TYPE_APPLY".'
      );
    }

    console.warn(
      `[BackgroundTask] DB enum missing "${type}". Continuing without normalization; task creation may fail until migrations are applied.`
    );
    return type;
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw error;
    }

    if (isBackupTaskType(type)) {
      throw new ServiceUnavailableError(
        `Background task type support for "${type}" could not be verified. Ensure database connectivity and apply pending migrations.`
      );
    }

    if (type === BackgroundTaskType.TOPIC_TYPE_APPLY) {
      throw new ServiceUnavailableError(
        "Topic type apply is temporarily unavailable because task type support could not be verified."
      );
    }

    console.warn(
      `[BackgroundTask] Could not verify DB enum values for "${type}". Continuing without fallback.`,
      error
    );
    return type;
  }
}

export async function assertBackgroundTaskTypesSupported(
  requiredTypes: BackgroundTaskType[]
): Promise<void> {
  const values = await getDbBackgroundTaskEnumValues();
  for (const type of requiredTypes) {
    if (!values.has(type)) {
      throw new ServiceUnavailableError(buildEnumSupportErrorMessage(type));
    }
  }
}

async function createBackgroundTaskWithResolvedType(
  dbClient: BackgroundTaskDbClient,
  input: CreateBackgroundTaskInput,
  normalizedType: BackgroundTaskType
): Promise<AdminBackgroundTask> {
  const baseData = {
    type: normalizedType,
    status: input.status ?? BackgroundTaskStatus.PENDING,
    label: input.label,
    input: input.input ?? undefined,
    attempt: 1,
    cancelledAttempt: null,
    cancelledAt: null,
  };

  try {
    return await dbClient.adminBackgroundTask.create({
      data: {
        ...baseData,
        userId: input.userId ?? null,
      },
    });
  } catch (error) {
    const isUserFkViolation =
      (error as any)?.code === "P2003" &&
      typeof ((error as any).meta as any)?.field_name === "string" &&
      String(((error as any).meta as any).field_name).includes("AdminBackgroundTask_userId_fkey");

    if (isUserFkViolation && input.userId) {
      console.warn(
        `[BackgroundTask] userId ${input.userId} does not exist in User table; creating task without userId reference.`
      );
      return dbClient.adminBackgroundTask.create({
        data: {
          ...baseData,
          userId: null,
        },
      });
    }

    throw error;
  }
}

export async function createBackgroundTaskWithClient(
  dbClient: BackgroundTaskDbClient,
  input: CreateBackgroundTaskInput
): Promise<AdminBackgroundTask> {
  const normalizedType = await normalizeTaskTypeForDatabase(input.type, dbClient);
  return createBackgroundTaskWithResolvedType(dbClient, input, normalizedType);
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
  return createBackgroundTaskWithClient(prisma as unknown as BackgroundTaskDbClient, {
    userId,
    type,
    label,
    input,
    status,
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

export async function markBackgroundTaskCompletedFromFailed(
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
      errorMessage: null,
    },
    {
      attempt,
      allowedStatuses: [BackgroundTaskStatus.FAILED],
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

export async function getAdminBackgroundTaskOrThrow(
  id: string
): Promise<AdminBackgroundTask> {
  const task = await prisma.adminBackgroundTask.findUnique({ where: { id } });
  if (!task) {
    throw new NotFoundError("Task not found");
  }
  return task;
}

export function buildBackgroundTaskListWhere({
  userId,
  types,
  includeNullOwned = true,
}: BackgroundTaskScopeOptions = {}): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (userId) {
    where.OR = includeNullOwned
      ? [{ userId }, { userId: null }]
      : [{ userId }];
  }

  if (types?.length) {
    where.type = { in: types };
  }

  return where;
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
    includeNullOwned?: boolean;
  } = {}
): Promise<AdminBackgroundTask[]> {
  const {
    types,
    take = 50,
    skip = 0,
    includeResult = false,
    includeNullOwned = true,
  } = options;
  const where = buildBackgroundTaskListWhere({ userId, types, includeNullOwned });

  if (includeResult) {
    return prisma.adminBackgroundTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
  }

  return prisma.adminBackgroundTask.findMany({
    where,
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

export async function countBackgroundTasksForUser(
  userId?: string | null,
  options: {
    types?: BackgroundTaskType[];
    includeNullOwned?: boolean;
  } = {}
): Promise<number> {
  const { types, includeNullOwned = true } = options;
  const where = buildBackgroundTaskListWhere({ userId, types, includeNullOwned });
  return prisma.adminBackgroundTask.count({ where });
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
