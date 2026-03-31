import { prisma } from "@/lib/db";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { decryptBackupPayload, sha256Hex } from "@/lib/backup/crypto";
import { BACKUP_TABLES } from "@/lib/backup/table-config";
import {
  BACKUP_SUPPORTED_VERSIONS,
  backupPayloadSchema,
  type BackupPayloadV1,
  type BackupValidationReport,
  type RestoreExecutionReport,
} from "@/lib/backup/types";
import { appendBackupAuditEvent, setRestoreLock } from "@/lib/services/restore-lock.service";
import { PrismaClient } from "@prisma/client";

const INT_SEQUENCE_TABLES = ["Level", "Tier", "UserLevel", "UserTierHistory", "VerificationToken"] as const;
const RESTORE_EXCLUDED_TABLES = new Set<string>(["AdminBackgroundTask"]);
const RESTORE_TRANSACTION_MAX_WAIT_MS = Number(process.env.BACKUP_RESTORE_TX_MAX_WAIT_MS || 15_000);
const RESTORE_TRANSACTION_TIMEOUT_MS = Number(process.env.BACKUP_RESTORE_TX_TIMEOUT_MS || 10 * 60 * 1000);

function parseBackupPayload(fileBuffer: Buffer): BackupPayloadV1 {
  const plaintext = decryptBackupPayload(fileBuffer);
  const parsed = backupPayloadSchema.parse(JSON.parse(plaintext.toString("utf-8")));
  return parsed;
}

export function validateBackupBuffer(fileBuffer: Buffer): BackupValidationReport {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const payload = parseBackupPayload(fileBuffer);

    if (!BACKUP_SUPPORTED_VERSIONS.includes(payload.manifest.backupVersion as (typeof BACKUP_SUPPORTED_VERSIONS)[number])) {
      errors.push(`Unsupported backup version: ${payload.manifest.backupVersion}`);
    }

    const checksum = sha256Hex(
      JSON.stringify({
        data: payload.data,
        storage: payload.storage,
      })
    );

    if (checksum !== payload.manifest.checksum) {
      errors.push("Backup checksum mismatch. File may be corrupted or tampered.");
    }

    for (const table of BACKUP_TABLES) {
      if (!payload.data[table.model]) {
        errors.push(`Missing table data for ${table.model}`);
      }
    }

    if (payload.manifest.storage.missingObjects.length > 0) {
      warnings.push(
        `Backup was created with ${payload.manifest.storage.missingObjects.length} missing storage objects.`
      );
    }

    return {
      valid: errors.length === 0,
      backupVersion: payload.manifest.backupVersion,
      createdAt: payload.manifest.createdAt,
      rowCounts: payload.manifest.rowCounts,
      storageObjectCount: payload.storage.length,
      warnings,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      warnings,
      errors: [
        error instanceof Error ? error.message : "Unable to parse backup file. Check encryption key and file integrity.",
      ],
    };
  }
}

type PrismaLike = PrismaClient | Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

async function truncateAllRestorableTables(db: PrismaLike): Promise<void> {
  const quoted = BACKUP_TABLES
    .filter((table) => !RESTORE_EXCLUDED_TABLES.has(table.model))
    .map((table) => `"${table.model}"`)
    .join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
}

async function resetIntSequences(db: PrismaLike): Promise<void> {
  for (const table of INT_SEQUENCE_TABLES) {
    await db.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"${table}"', 'id'),
        COALESCE((SELECT MAX(id) FROM "${table}"), 1),
        (SELECT COUNT(*) > 0 FROM "${table}")
      )
    `);
  }
}

async function restorePreservedBackgroundTasks(
  db: PrismaLike,
  tasks: any[]
): Promise<number> {
  if (!tasks.length) return 0;

  let restored = 0;
  const chunkSize = 250;
  for (let i = 0; i < tasks.length; i += chunkSize) {
    const chunk = tasks.slice(i, i + chunkSize);
    const result = await db.adminBackgroundTask.createMany({
      data: chunk.map((task) => ({
        ...task,
        // Restore can replace the User table; nullable owner keeps tasks queryable by admins.
        userId: null,
      })),
      skipDuplicates: true,
    });
    restored += result.count;
  }

  return restored;
}

async function insertTableData(db: PrismaLike, payload: BackupPayloadV1): Promise<Record<string, number>> {
  const restoredRows: Record<string, number> = {};

  for (const table of BACKUP_TABLES) {
    if (RESTORE_EXCLUDED_TABLES.has(table.model)) {
      restoredRows[table.model] = 0;
      continue;
    }

    const rows = payload.data[table.model] ?? [];
    if (rows.length === 0) {
      restoredRows[table.model] = 0;
      continue;
    }

    const delegate = (db as unknown as Record<string, any>)[table.delegate];
    if (!delegate || typeof delegate.createMany !== "function") {
      throw new Error(`Missing Prisma delegate for ${table.model}`);
    }

    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await delegate.createMany({ data: chunk });
    }

    restoredRows[table.model] = rows.length;
  }

  return restoredRows;
}

async function restoreStorageObjects(payload: BackupPayloadV1): Promise<number> {
  if (!payload.storage.length || !isSupabaseConfigured()) {
    return 0;
  }

  const supabase = getSupabaseClient();
  let restored = 0;

  for (const object of payload.storage) {
    const bytes = Buffer.from(object.base64, "base64");
    const checksum = sha256Hex(bytes);
    if (checksum !== object.checksum) {
      continue;
    }

    const { error } = await supabase.storage
      .from(object.bucket)
      .upload(object.path, bytes, {
        upsert: true,
        contentType: object.contentType || undefined,
      });

    if (!error) {
      restored += 1;
    }
  }

  return restored;
}

export async function restoreBackupFromBuffer(input: {
  fileBuffer: Buffer;
  actorId: string;
}): Promise<RestoreExecutionReport> {
  const startedAt = new Date();
  const warnings: string[] = [];
  const errors: string[] = [];
  const reportBase = {
    success: false,
    startedAt: startedAt.toISOString(),
    completedAt: startedAt.toISOString(),
    restoredRows: {} as Record<string, number>,
    restoredStorageObjects: 0,
    warnings,
    errors,
  };

  const validation = validateBackupBuffer(input.fileBuffer);
  if (!validation.valid) {
    return {
      ...reportBase,
      completedAt: new Date().toISOString(),
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const payload = parseBackupPayload(input.fileBuffer);
  const preservedBackgroundTasks = await prisma.adminBackgroundTask.findMany({
    select: {
      id: true,
      type: true,
      status: true,
      attempt: true,
      cancelledAt: true,
      cancelledAttempt: true,
      label: true,
      input: true,
      result: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (RESTORE_EXCLUDED_TABLES.size > 0) {
    warnings.push(
      `Skipped restore for tables: ${Array.from(RESTORE_EXCLUDED_TABLES).join(", ")} to preserve live task tracking.`
    );
  }
  await setRestoreLock(true, input.actorId, {
    reason: "backup_restore_started",
    backupVersion: payload.manifest.backupVersion,
  });

  try {
    await prisma.$transaction(
      async (tx) => {
        await truncateAllRestorableTables(tx);
        reportBase.restoredRows = await insertTableData(tx, payload);
        await resetIntSequences(tx);
        const restoredTaskCount = await restorePreservedBackgroundTasks(tx, preservedBackgroundTasks);
        if (restoredTaskCount !== preservedBackgroundTasks.length) {
          warnings.push(
            `Restored ${restoredTaskCount}/${preservedBackgroundTasks.length} preserved background tasks after database truncate.`
          );
        }
      },
      {
        maxWait: RESTORE_TRANSACTION_MAX_WAIT_MS,
        timeout: RESTORE_TRANSACTION_TIMEOUT_MS,
      }
    );

    reportBase.restoredStorageObjects = await restoreStorageObjects(payload);
    const completedAt = new Date().toISOString();

    await appendBackupAuditEvent({
      action: "RESTORE_COMPLETED",
      actorId: input.actorId,
      context: {
        backupVersion: payload.manifest.backupVersion,
        checksum: payload.manifest.checksum,
        restoredRows: reportBase.restoredRows,
        restoredStorageObjects: reportBase.restoredStorageObjects,
      },
    });

    return {
      success: true,
      startedAt: reportBase.startedAt,
      completedAt,
      restoredRows: reportBase.restoredRows,
      restoredStorageObjects: reportBase.restoredStorageObjects,
      warnings,
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown restore error";
    errors.push(message);
    await appendBackupAuditEvent({
      action: "RESTORE_FAILED",
      actorId: input.actorId,
      context: { message },
    });
    return {
      ...reportBase,
      completedAt: new Date().toISOString(),
      errors,
      warnings,
    };
  } finally {
    await setRestoreLock(false, input.actorId, { reason: "backup_restore_finished" });
  }
}
