import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

const RESTORE_LOCK_KEY = "backup_restore_lock";
const RESTORE_AUDIT_KEY = "backup_restore_audit_log";

export async function isRestoreLocked(): Promise<boolean> {
  const record = await prisma.appSettings.findUnique({
    where: { key: RESTORE_LOCK_KEY },
    select: { value: true },
  });

  return record?.value === "true";
}

export async function setRestoreLock(
  locked: boolean,
  updatedBy: string,
  context?: Record<string, unknown>
): Promise<void> {
  await prisma.appSettings.upsert({
    where: { key: RESTORE_LOCK_KEY },
    create: {
      key: RESTORE_LOCK_KEY,
      category: "backup",
      value: locked ? "true" : "false",
      updatedBy,
    },
    update: {
      value: locked ? "true" : "false",
      updatedBy,
    },
  });

  if (context) {
    await appendBackupAuditEvent({
      action: locked ? "LOCK_ENABLED" : "LOCK_DISABLED",
      actorId: updatedBy,
      context,
    });
  }
}

export async function assertRestoreUnlocked(): Promise<void> {
  const locked = await isRestoreLocked();
  if (locked) {
    throw new AppError(423, "Writes are temporarily disabled while backup restore is in progress", "RESTORE_LOCKED");
  }
}

export async function appendBackupAuditEvent(input: {
  action: string;
  actorId: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  const existing = await prisma.appSettings.findUnique({
    where: { key: RESTORE_AUDIT_KEY },
    select: { value: true },
  });

  let parsed: Array<Record<string, unknown>> = [];
  if (existing?.value) {
    try {
      parsed = JSON.parse(existing.value) as Array<Record<string, unknown>>;
    } catch {
      parsed = [];
    }
  }

  parsed.push({
    ts: new Date().toISOString(),
    action: input.action,
    actorId: input.actorId,
    ...(input.context ?? {}),
  });

  const limited = parsed.slice(-200);

  await prisma.appSettings.upsert({
    where: { key: RESTORE_AUDIT_KEY },
    create: {
      key: RESTORE_AUDIT_KEY,
      category: "backup",
      value: JSON.stringify(limited),
      updatedBy: input.actorId,
    },
    update: {
      value: JSON.stringify(limited),
      updatedBy: input.actorId,
    },
  });
}
