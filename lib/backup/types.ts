import { z } from "zod";

export const BACKUP_MAGIC = "SPORTSTRIVIA_BACKUP_V1";
export const BACKUP_VERSION = "1.0.0";
export const BACKUP_SUPPORTED_VERSIONS = ["1.0.0"] as const;

export const backupEncryptionMetadataSchema = z.object({
  alg: z.literal("aes-256-gcm"),
  kdf: z.literal("pbkdf2-sha256"),
  iterations: z.number().int().positive(),
  salt: z.string().min(1),
  iv: z.string().min(1),
  tag: z.string().min(1),
});

export const backupManifestSchema = z.object({
  magic: z.literal(BACKUP_MAGIC),
  backupVersion: z.string().min(1),
  createdAt: z.string().datetime(),
  appVersion: z.string().min(1),
  prismaMigrationState: z.array(
    z.object({
      migration_name: z.string(),
      finished_at: z.string().nullable(),
      rolled_back_at: z.string().nullable(),
      applied_steps_count: z.number().int().nonnegative(),
    })
  ),
  rowCounts: z.record(z.string(), z.number().int().nonnegative()),
  rowChecksums: z.record(z.string(), z.string()),
  storage: z.object({
    totalObjects: z.number().int().nonnegative(),
    missingObjects: z.array(
      z.object({
        bucket: z.string(),
        path: z.string(),
        reason: z.string(),
      })
    ),
  }),
  checksum: z.string(),
  encryption: backupEncryptionMetadataSchema.nullable(),
});

export type BackupManifestV1 = z.infer<typeof backupManifestSchema>;

export const backupStorageObjectSchema = z.object({
  bucket: z.string(),
  path: z.string(),
  contentType: z.string().nullable().optional(),
  base64: z.string(),
  checksum: z.string(),
});

export const backupPayloadSchema = z.object({
  manifest: backupManifestSchema.extend({
    encryption: z.null(),
  }),
  data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  storage: z.array(backupStorageObjectSchema),
});

export type BackupPayloadV1 = z.infer<typeof backupPayloadSchema>;

export const encryptedBackupEnvelopeSchema = z.object({
  magic: z.literal(BACKUP_MAGIC),
  version: z.literal(BACKUP_VERSION),
  encryption: backupEncryptionMetadataSchema,
  ciphertext: z.string().min(1),
});

export type EncryptedBackupEnvelope = z.infer<typeof encryptedBackupEnvelopeSchema>;

export const backupValidationReportSchema = z.object({
  valid: z.boolean(),
  backupVersion: z.string().optional(),
  createdAt: z.string().optional(),
  rowCounts: z.record(z.string(), z.number().int().nonnegative()).optional(),
  storageObjectCount: z.number().int().nonnegative().optional(),
  warnings: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
});

export type BackupValidationReport = z.infer<typeof backupValidationReportSchema>;

export const restoreExecutionReportSchema = z.object({
  success: z.boolean(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  restoredRows: z.record(z.string(), z.number().int().nonnegative()),
  restoredStorageObjects: z.number().int().nonnegative(),
  warnings: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
});

export type RestoreExecutionReport = z.infer<typeof restoreExecutionReportSchema>;
