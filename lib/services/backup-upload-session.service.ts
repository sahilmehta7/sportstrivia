import { createHash, randomUUID } from "crypto";
import { BackupUploadSessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, BadRequestError, NotFoundError } from "@/lib/errors";
import { getSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase";

const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB
const DEFAULT_UPLOAD_TTL_HOURS = 24;
const BACKUP_FILE_EXTENSION = ".strbk";
const ALLOWED_CONTENT_TYPES = new Set([
  "application/octet-stream",
  "application/x-binary",
  "application/vnd.binary",
]);
const SHA256_HEX_RE = /^[a-f0-9]{64}$/;

export const BACKUP_UPLOAD_BUCKET = process.env.BACKUP_UPLOAD_BUCKET || "admin-backups-private";
export const BACKUP_UPLOAD_MAX_BYTES = Number(process.env.BACKUP_UPLOAD_MAX_BYTES || DEFAULT_MAX_UPLOAD_BYTES);
export const BACKUP_UPLOAD_TTL_HOURS = Number(process.env.BACKUP_UPLOAD_TTL_HOURS || DEFAULT_UPLOAD_TTL_HOURS);

export interface CreateBackupUploadSessionInput {
  actorId: string;
  fileName: string;
  fileSizeBytes: number;
  contentType?: string | null;
  fileChecksum?: string | null;
}

export interface BackupUploadSessionCreation {
  uploadSessionId: string;
  bucket: string;
  objectPath: string;
  uploadToken: string;
  signedUploadUrl: string;
  expiresAt: string;
  maxBytes: number;
}

function assertServiceRoleConfigured() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new AppError(503, "Supabase service role is required for backup upload/restore", "SUPABASE_SERVICE_ROLE_REQUIRED");
  }
}

function isAllowedContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return true;
  const normalized = contentType.trim().toLowerCase();
  if (!normalized) return true;
  return ALLOWED_CONTENT_TYPES.has(normalized);
}

function normalizeDeclaredChecksum(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  const withoutPrefix = trimmed.startsWith("sha256:") ? trimmed.slice("sha256:".length) : trimmed;
  if (!SHA256_HEX_RE.test(withoutPrefix)) {
    throw new BadRequestError("fileChecksum must be a SHA-256 hex string (64 chars, optional sha256: prefix)");
  }
  return `sha256:${withoutPrefix}`;
}

function extractStoredSha256Hex(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  const withoutPrefix = trimmed.startsWith("sha256:") ? trimmed.slice("sha256:".length) : trimmed;
  if (!SHA256_HEX_RE.test(withoutPrefix)) {
    return null;
  }
  return withoutPrefix;
}

function assertValidBackupUploadInput(input: CreateBackupUploadSessionInput): void {
  const fileName = input.fileName.trim();
  if (!fileName) {
    throw new BadRequestError("File name is required");
  }
  if (!fileName.toLowerCase().endsWith(BACKUP_FILE_EXTENSION)) {
    throw new BadRequestError("Only .strbk backup files are allowed");
  }

  if (!Number.isInteger(input.fileSizeBytes) || input.fileSizeBytes <= 0) {
    throw new BadRequestError("File size must be a positive integer");
  }

  if (input.fileSizeBytes > BACKUP_UPLOAD_MAX_BYTES) {
    throw new AppError(
      413,
      `Backup file exceeds max allowed size of ${BACKUP_UPLOAD_MAX_BYTES} bytes`,
      "BACKUP_FILE_TOO_LARGE"
    );
  }

  if (!isAllowedContentType(input.contentType)) {
    throw new BadRequestError("Unsupported backup content type");
  }
}

async function ensureBackupUploadBucket(): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();
  const { data: existing, error: existingError } = await supabase.storage.getBucket(BACKUP_UPLOAD_BUCKET);

  if (existing && !existingError) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(BACKUP_UPLOAD_BUCKET, {
    public: false,
  });

  // Ignore "already exists" and retry/validate by fetching bucket once.
  if (createError) {
    const { data: confirmBucket, error: confirmError } = await supabase.storage.getBucket(BACKUP_UPLOAD_BUCKET);
    if (!confirmBucket || confirmError) {
      throw new AppError(500, `Unable to ensure backup upload bucket: ${createError.message}`, "BACKUP_BUCKET_ERROR");
    }
  }
}

function buildObjectPath(actorId: string): string {
  const nonce = randomUUID();
  return `${actorId}/${Date.now()}-${nonce}${BACKUP_FILE_EXTENSION}`;
}

export async function createBackupUploadSession(input: CreateBackupUploadSessionInput): Promise<BackupUploadSessionCreation> {
  assertServiceRoleConfigured();
  assertValidBackupUploadInput(input);
  await ensureBackupUploadBucket();
  const normalizedChecksum = normalizeDeclaredChecksum(input.fileChecksum);

  const supabase = getSupabaseServiceRoleClient();
  const objectPath = buildObjectPath(input.actorId);
  const expiresAt = new Date(Date.now() + BACKUP_UPLOAD_TTL_HOURS * 60 * 60 * 1000);

  const { data: signedData, error: signedError } = await supabase.storage
    .from(BACKUP_UPLOAD_BUCKET)
    .createSignedUploadUrl(objectPath, {
      upsert: false,
    });

  if (signedError || !signedData?.token || !signedData.signedUrl) {
    throw new AppError(500, signedError?.message || "Unable to create signed upload URL", "SIGNED_UPLOAD_CREATE_FAILED");
  }

  const session = await prisma.backupUploadSession.create({
    data: {
      actorId: input.actorId,
      bucket: BACKUP_UPLOAD_BUCKET,
      objectPath,
      status: BackupUploadSessionStatus.PENDING_UPLOAD,
      maxBytes: BACKUP_UPLOAD_MAX_BYTES,
      fileSizeBytes: input.fileSizeBytes,
      fileChecksum: normalizedChecksum,
      expiresAt,
    },
  });

  return {
    uploadSessionId: session.id,
    bucket: session.bucket,
    objectPath: session.objectPath,
    uploadToken: signedData.token,
    signedUploadUrl: signedData.signedUrl,
    expiresAt: session.expiresAt.toISOString(),
    maxBytes: session.maxBytes,
  };
}

export async function getOwnedBackupUploadSessionOrThrow(uploadSessionId: string, actorId: string) {
  const session = await prisma.backupUploadSession.findUnique({ where: { id: uploadSessionId } });
  if (!session || session.actorId !== actorId) {
    throw new NotFoundError("Backup upload session not found");
  }

  if (session.deletedAt) {
    throw new AppError(410, "Backup upload session has been deleted", "BACKUP_UPLOAD_DELETED");
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.backupUploadSession.update({
      where: { id: session.id },
      data: {
        status: BackupUploadSessionStatus.EXPIRED,
        lastError: "Session expired",
      },
    });
    throw new AppError(410, "Backup upload session expired", "BACKUP_UPLOAD_EXPIRED");
  }

  return session;
}

export async function getBackupBufferForSession(uploadSessionId: string, actorId: string): Promise<{
  bytes: Buffer;
  session: Awaited<ReturnType<typeof getOwnedBackupUploadSessionOrThrow>>;
}> {
  assertServiceRoleConfigured();
  const session = await getOwnedBackupUploadSessionOrThrow(uploadSessionId, actorId);

  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.storage.from(session.bucket).download(session.objectPath);
  if (error || !data) {
    throw new AppError(404, error?.message || "Backup file not found in storage", "BACKUP_UPLOAD_NOT_FOUND");
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  if (bytes.length === 0) {
    throw new BadRequestError("Uploaded backup file is empty");
  }

  if (bytes.length > session.maxBytes) {
    throw new AppError(413, "Uploaded backup file exceeds max allowed size", "BACKUP_FILE_TOO_LARGE");
  }

  if (session.fileSizeBytes && bytes.length !== session.fileSizeBytes) {
    throw new BadRequestError("Uploaded backup file size does not match declared size");
  }

  if (session.fileChecksum) {
    const expectedChecksum = extractStoredSha256Hex(session.fileChecksum);
    if (!expectedChecksum) {
      throw new AppError(500, "Stored backup checksum is invalid", "BACKUP_CHECKSUM_INVALID");
    }
    const actualChecksum = createHash("sha256").update(bytes).digest("hex");
    if (actualChecksum !== expectedChecksum) {
      const lastError = "Uploaded backup checksum does not match declared checksum";
      await prisma.backupUploadSession.update({
        where: { id: session.id },
        data: {
          status: BackupUploadSessionStatus.FAILED,
          lastError,
        },
      });
      throw new AppError(422, lastError, "BACKUP_FILE_CHECKSUM_MISMATCH");
    }
  }

  if (session.status === BackupUploadSessionStatus.PENDING_UPLOAD) {
    await prisma.backupUploadSession.update({
      where: { id: session.id },
      data: {
        status: BackupUploadSessionStatus.UPLOADED,
        uploadedAt: new Date(),
      },
    });
  }

  return { bytes, session };
}

export async function markBackupUploadSessionValidated(uploadSessionId: string): Promise<void> {
  await prisma.backupUploadSession.update({
    where: { id: uploadSessionId },
    data: {
      status: BackupUploadSessionStatus.VALIDATED,
      validatedAt: new Date(),
      lastError: null,
    },
  });
}

export async function markBackupUploadSessionRestoreInProgress(uploadSessionId: string, taskId: string): Promise<void> {
  await prisma.backupUploadSession.update({
    where: { id: uploadSessionId },
    data: {
      status: BackupUploadSessionStatus.RESTORE_IN_PROGRESS,
      taskId,
      lastError: null,
    },
  });
}

export async function markBackupUploadSessionFailed(uploadSessionId: string, message: string): Promise<void> {
  await prisma.backupUploadSession.update({
    where: { id: uploadSessionId },
    data: {
      status: BackupUploadSessionStatus.FAILED,
      lastError: message,
    },
  });
}

async function removeSessionObject(session: { bucket: string; objectPath: string }): Promise<string | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.storage.from(session.bucket).remove([session.objectPath]);
  if (error) {
    return error.message;
  }
  return null;
}

export async function markBackupUploadSessionRestoredAndDelete(uploadSessionId: string): Promise<void> {
  const session = await prisma.backupUploadSession.findUnique({ where: { id: uploadSessionId } });
  if (!session) return;

  const deleteError = await removeSessionObject(session);
  await prisma.backupUploadSession.update({
    where: { id: uploadSessionId },
    data: {
      status: BackupUploadSessionStatus.RESTORED,
      restoredAt: new Date(),
      deletedAt: deleteError ? null : new Date(),
      lastError: deleteError ? `Delete warning: ${deleteError}` : null,
    },
  });
}

export async function cleanupExpiredBackupUploadSessions(): Promise<{
  expiredSessions: number;
  deletedObjects: number;
  failures: number;
}> {
  assertServiceRoleConfigured();

  const now = new Date();
  const candidates = await prisma.backupUploadSession.findMany({
    where: {
      deletedAt: null,
      expiresAt: { lt: now },
      status: {
        in: [
          BackupUploadSessionStatus.PENDING_UPLOAD,
          BackupUploadSessionStatus.UPLOADED,
          BackupUploadSessionStatus.VALIDATED,
          BackupUploadSessionStatus.FAILED,
          BackupUploadSessionStatus.EXPIRED,
        ],
      },
    },
    select: {
      id: true,
      bucket: true,
      objectPath: true,
    },
    take: 250,
  });

  let deletedObjects = 0;
  let failures = 0;

  for (const session of candidates) {
    try {
      const supabase = getSupabaseServiceRoleClient();
      const { error } = await supabase.storage.from(session.bucket).remove([session.objectPath]);
      if (!error) {
        deletedObjects += 1;
        await prisma.backupUploadSession.update({
          where: { id: session.id },
          data: {
            status: BackupUploadSessionStatus.EXPIRED,
            deletedAt: new Date(),
            lastError: "Expired session cleaned up",
          },
        });
      } else {
        failures += 1;
        await prisma.backupUploadSession.update({
          where: { id: session.id },
          data: {
            status: BackupUploadSessionStatus.EXPIRED,
            deletedAt: null,
            lastError: `Delete warning: ${error.message}`,
          },
        });
      }
    } catch (error) {
      failures += 1;
      await prisma.backupUploadSession.update({
        where: { id: session.id },
        data: {
          status: BackupUploadSessionStatus.FAILED,
          lastError: error instanceof Error ? error.message : "Unknown cleanup failure",
        },
      });
    }
  }

  return {
    expiredSessions: candidates.length,
    deletedObjects,
    failures,
  };
}
