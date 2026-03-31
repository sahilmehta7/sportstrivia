jest.mock("@/lib/db", () => ({
  prisma: {},
}));

jest.mock("@/lib/supabase", () => ({
  getSupabaseClient: jest.fn(),
  isSupabaseConfigured: jest.fn(() => false),
}));

jest.mock("@/lib/services/restore-lock.service", () => ({
  appendBackupAuditEvent: jest.fn(),
  setRestoreLock: jest.fn(),
}));

import { BACKUP_TABLES } from "@/lib/backup/table-config";
import { encryptBackupPayload, sha256Hex } from "@/lib/backup/crypto";
import { BACKUP_MAGIC, BACKUP_VERSION, type BackupPayloadV1 } from "@/lib/backup/types";
import { validateBackupBuffer } from "@/lib/services/backup-restore.service";

function buildEncryptedBackup(input?: {
  dataOverride?: Record<string, Array<Record<string, unknown>>>;
  backupVersion?: string;
}): Buffer {
  const baseData = Object.fromEntries(
    BACKUP_TABLES.map((table) => [table.model, [] as Array<Record<string, unknown>>])
  ) as Record<string, Array<Record<string, unknown>>>;

  const data = input?.dataOverride ?? baseData;
  const storage: BackupPayloadV1["storage"] = [];
  const rowChecksums = Object.fromEntries(
    Object.entries(data).map(([model, rows]) => [model, sha256Hex(JSON.stringify(rows))])
  );
  const rowCounts = Object.fromEntries(
    Object.entries(data).map(([model, rows]) => [model, rows.length])
  );

  const payload: BackupPayloadV1 = {
    manifest: {
      magic: BACKUP_MAGIC,
      backupVersion: input?.backupVersion ?? BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      appVersion: "test",
      prismaMigrationState: [],
      rowCounts,
      rowChecksums,
      storage: {
        totalObjects: 0,
        missingObjects: [],
      },
      checksum: sha256Hex(
        JSON.stringify({
          data,
          storage,
        })
      ),
      encryption: null,
    },
    data,
    storage,
  };

  return encryptBackupPayload(Buffer.from(JSON.stringify(payload), "utf8"));
}

describe("validateBackupBuffer", () => {
  beforeEach(() => {
    process.env.BACKUP_ENCRYPTION_KEY = "test-backup-encryption-key-123";
  });

  it("rejects backups that are missing newly required table data", () => {
    const data = Object.fromEntries(
      BACKUP_TABLES.map((table) => [table.model, [] as Array<Record<string, unknown>>])
    ) as Record<string, Array<Record<string, unknown>>>;
    delete data.TopicRelation;

    const encrypted = buildEncryptedBackup({ dataOverride: data });
    const report = validateBackupBuffer(encrypted);

    expect(report.valid).toBe(false);
    expect(report.errors).toContain("Missing table data for TopicRelation");
  });

  it("rejects backups from unsupported prior versions", () => {
    const encrypted = buildEncryptedBackup({ backupVersion: "1.0.0" });
    const report = validateBackupBuffer(encrypted);

    expect(report.valid).toBe(false);
    expect(report.errors).toContain("Unsupported backup version: 1.0.0");
  });
});
