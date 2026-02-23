import { prisma } from "@/lib/db";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { encryptBackupPayload, sha256Hex } from "@/lib/backup/crypto";
import { BACKUP_TABLES } from "@/lib/backup/table-config";
import {
  BACKUP_MAGIC,
  BACKUP_VERSION,
  backupPayloadSchema,
  type BackupManifestV1,
  type BackupPayloadV1,
} from "@/lib/backup/types";

type StorageRef = { bucket: string; path: string };

function toSerializableRows(rows: unknown[]): Array<Record<string, unknown>> {
  return rows.map((row) => JSON.parse(JSON.stringify(row)) as Record<string, unknown>);
}

function extractStorageRefsFromValue(value: unknown, refs: Set<string>, storageUrlPrefix: string | null): void {
  if (typeof value === "string") {
    if (storageUrlPrefix && value.startsWith(storageUrlPrefix)) {
      const pathPart = value.slice(storageUrlPrefix.length);
      const firstSlash = pathPart.indexOf("/");
      if (firstSlash > 0) {
        const bucket = pathPart.slice(0, firstSlash);
        const path = pathPart.slice(firstSlash + 1);
        if (bucket && path) {
          refs.add(`${bucket}:::${path}`);
        }
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      extractStorageRefsFromValue(item, refs, storageUrlPrefix);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      extractStorageRefsFromValue(nested, refs, storageUrlPrefix);
    }
  }
}

function collectStorageRefs(data: Record<string, Array<Record<string, unknown>>>): StorageRef[] {
  const refs = new Set<string>();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const storagePublicPrefix = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/` : null;

  for (const rows of Object.values(data)) {
    for (const row of rows) {
      extractStorageRefsFromValue(row, refs, storagePublicPrefix);

      const bucketValue = row.bucket;
      const fileUrlValue = row.fileUrl;
      if (typeof bucketValue === "string" && typeof fileUrlValue === "string" && storagePublicPrefix) {
        if (fileUrlValue.startsWith(storagePublicPrefix)) {
          const pathPart = fileUrlValue.slice(storagePublicPrefix.length);
          const firstSlash = pathPart.indexOf("/");
          if (firstSlash > 0) {
            const filePath = pathPart.slice(firstSlash + 1);
            if (filePath) {
              refs.add(`${bucketValue}:::${filePath}`);
            }
          }
        }
      }
    }
  }

  return Array.from(refs).map((entry) => {
    const [bucket, path] = entry.split(":::");
    return { bucket, path };
  });
}

async function loadAllTableData(): Promise<{
  data: Record<string, Array<Record<string, unknown>>>;
  rowCounts: Record<string, number>;
  rowChecksums: Record<string, string>;
}> {
  const data: Record<string, Array<Record<string, unknown>>> = {};
  const rowCounts: Record<string, number> = {};
  const rowChecksums: Record<string, string> = {};

  for (const table of BACKUP_TABLES) {
    const delegate = (prisma as unknown as Record<string, any>)[table.delegate];
    if (!delegate || typeof delegate.findMany !== "function") {
      throw new Error(`Missing Prisma delegate for ${table.model}`);
    }

    const rows = await delegate.findMany({
      orderBy: table.orderBy || { id: "asc" },
    });
    const serializableRows = toSerializableRows(rows as unknown[]);
    data[table.model] = serializableRows;
    rowCounts[table.model] = serializableRows.length;
    rowChecksums[table.model] = sha256Hex(JSON.stringify(serializableRows));
  }

  return { data, rowCounts, rowChecksums };
}

async function loadMigrationState(): Promise<BackupManifestV1["prismaMigrationState"]> {
  type MigrationRecord = {
    migration_name: string;
    finished_at: Date | null;
    rolled_back_at: Date | null;
    applied_steps_count: number;
  };

  const rows = (await prisma.$queryRawUnsafe(
    `SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
     FROM "_prisma_migrations"
     ORDER BY finished_at DESC NULLS LAST, migration_name ASC`
  )) as MigrationRecord[];

  return rows.map((row) => ({
    migration_name: row.migration_name,
    finished_at: row.finished_at ? row.finished_at.toISOString() : null,
    rolled_back_at: row.rolled_back_at ? row.rolled_back_at.toISOString() : null,
    applied_steps_count: row.applied_steps_count,
  }));
}

async function exportStorageObjects(
  refs: StorageRef[]
): Promise<{
  storageObjects: BackupPayloadV1["storage"];
  missingObjects: BackupManifestV1["storage"]["missingObjects"];
}> {
  if (!refs.length || !isSupabaseConfigured()) {
    return { storageObjects: [], missingObjects: [] };
  }

  const supabase = getSupabaseClient();
  const storageObjects: BackupPayloadV1["storage"] = [];
  const missingObjects: BackupManifestV1["storage"]["missingObjects"] = [];

  for (const ref of refs) {
    const { data, error } = await supabase.storage.from(ref.bucket).download(ref.path);
    if (error || !data) {
      missingObjects.push({
        bucket: ref.bucket,
        path: ref.path,
        reason: error?.message ?? "Object not found",
      });
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    storageObjects.push({
      bucket: ref.bucket,
      path: ref.path,
      contentType: data.type || null,
      base64: buffer.toString("base64"),
      checksum: sha256Hex(buffer),
    });
  }

  return { storageObjects, missingObjects };
}

export async function createEncryptedBackupSnapshot(): Promise<{
  fileName: string;
  encryptedBuffer: Buffer;
  manifest: BackupManifestV1;
}> {
  const createdAt = new Date().toISOString();
  const { data, rowCounts, rowChecksums } = await loadAllTableData();
  const migrationState = await loadMigrationState();
  const storageRefs = collectStorageRefs(data);
  const { storageObjects, missingObjects } = await exportStorageObjects(storageRefs);

  const plaintextManifest: BackupPayloadV1["manifest"] = {
    magic: BACKUP_MAGIC,
    backupVersion: BACKUP_VERSION,
    createdAt,
    appVersion: process.env.npm_package_version || "unknown",
    prismaMigrationState: migrationState,
    rowCounts,
    rowChecksums,
    storage: {
      totalObjects: storageObjects.length,
      missingObjects,
    },
    checksum: "",
    encryption: null,
  };

  const checksumBase = {
    data,
    storage: storageObjects,
  };
  plaintextManifest.checksum = sha256Hex(JSON.stringify(checksumBase));

  const plaintextPayload: BackupPayloadV1 = {
    manifest: plaintextManifest,
    data,
    storage: storageObjects,
  };
  backupPayloadSchema.parse(plaintextPayload);

  const plaintextBytes = Buffer.from(JSON.stringify(plaintextPayload), "utf-8");
  const encryptedBuffer = encryptBackupPayload(plaintextBytes);

  const encryptedParsed = JSON.parse(encryptedBuffer.toString("utf-8")) as {
    encryption: BackupManifestV1["encryption"];
  };

  const finalManifest: BackupManifestV1 = {
    ...plaintextManifest,
    encryption: encryptedParsed.encryption ?? null,
  };

  const datePart = createdAt.slice(0, 10);
  const fileName = `sportstrivia-backup-${datePart}-${Date.now()}.strbk`;

  return {
    fileName,
    encryptedBuffer,
    manifest: finalManifest,
  };
}
