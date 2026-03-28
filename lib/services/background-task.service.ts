import { prisma } from "@/lib/db";
import {
  AdminBackgroundTask,
  BackgroundTaskStatus,
  BackgroundTaskType,
} from "@prisma/client";
import { ServiceUnavailableError } from "@/lib/errors";

export interface CreateBackgroundTaskInput {
  userId?: string | null;
  type: BackgroundTaskType;
  label: string;
  input?: unknown;
  status?: BackgroundTaskStatus;
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
    skip?: number;
    includeResult?: boolean; // Optionally include full result (expensive for large JSON)
  } = {}
): Promise<AdminBackgroundTask[]> {
  const { types, take = 50, skip = 0, includeResult = false } = options;
  
  // When listing tasks, exclude the large result field to avoid connection pool timeouts
  // The result field can contain large raw OpenAI responses (can be 100KB+ per task)
  // Only include it when explicitly requested (e.g., for task detail view)
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
  
  // Exclude result field for list queries - much faster and prevents connection pool exhaustion
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
      label: true,
      input: true,
      // Exclude 'result' field to avoid loading large JSON blobs
      // result: true, // Commented out - only fetch when viewing detail
      errorMessage: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  }) as Promise<AdminBackgroundTask[]>;
}

/**
 * Updates task progress without affecting other result fields.
 * This is useful for long-running tasks to show incremental progress.
 */
export async function updateTaskProgress(
  id: string,
  progress: { percentage: number; status: string }
): Promise<void> {
  const task = await getBackgroundTaskById(id);
  if (!task) {
    console.warn(`[BackgroundTask] Task ${id} not found for progress update`);
    return;
  }
  
  const currentResult = (task.result as any) || {};
  await updateBackgroundTask(id, {
    result: {
      ...currentResult,
      progress,
    },
  });
}
