/** @jest-environment node */

import { BackupUploadSessionStatus } from "@prisma/client";

var prismaMock: {
  backupUploadSession: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
  };
};

const getSupabaseServiceRoleClient = jest.fn();
const isSupabaseServiceRoleConfigured = jest.fn();

jest.mock("@/lib/db", () => {
  prismaMock = {
    backupUploadSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

jest.mock("@/lib/supabase", () => ({
  getSupabaseServiceRoleClient: (...args: any[]) => getSupabaseServiceRoleClient(...args),
  isSupabaseServiceRoleConfigured: (...args: any[]) => isSupabaseServiceRoleConfigured(...args),
}));

import {
  createBackupUploadSession,
  cleanupExpiredBackupUploadSessions,
  getBackupBufferForSession,
} from "@/lib/services/backup-upload-session.service";

describe("backup-upload-session.service", () => {
  const remove = jest.fn();
  const createSignedUploadUrl = jest.fn();
  const download = jest.fn();
  const getBucket = jest.fn();
  const createBucket = jest.fn();
  const from = jest.fn(() => ({
    createSignedUploadUrl,
    download,
    remove,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    isSupabaseServiceRoleConfigured.mockReturnValue(true);
    getSupabaseServiceRoleClient.mockReturnValue({
      storage: {
        from,
        getBucket,
        createBucket,
      },
    });
    getBucket.mockResolvedValue({ data: { id: "bucket" }, error: null });
    createBucket.mockResolvedValue({ error: null });
    createSignedUploadUrl.mockResolvedValue({
      data: {
        token: "token_1",
        signedUrl: "https://example.test/upload",
      },
      error: null,
    });
    prismaMock.backupUploadSession.create.mockResolvedValue({
      id: "session_1",
      bucket: "admin-backups-private",
      objectPath: "admin_1/path.strbk",
      expiresAt: new Date(Date.now() + 60_000),
      maxBytes: 50 * 1024 * 1024,
    });
  });

  it("normalizes valid checksum and rejects invalid checksum format", async () => {
    await expect(
      createBackupUploadSession({
        actorId: "admin_1",
        fileName: "backup.strbk",
        fileSizeBytes: 1024,
        fileChecksum: "not-a-sha",
      })
    ).rejects.toThrow("fileChecksum must be a SHA-256 hex string");

    const sha = "a".repeat(64);
    await createBackupUploadSession({
      actorId: "admin_1",
      fileName: "backup.strbk",
      fileSizeBytes: 1024,
      fileChecksum: `sha256:${sha}`,
    });

    expect(prismaMock.backupUploadSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileChecksum: `sha256:${sha}`,
        }),
      })
    );
  });

  it("fails and marks session when uploaded checksum mismatches", async () => {
    prismaMock.backupUploadSession.findUnique.mockResolvedValue({
      id: "session_1",
      actorId: "admin_1",
      bucket: "admin-backups-private",
      objectPath: "admin_1/path.strbk",
      status: BackupUploadSessionStatus.UPLOADED,
      maxBytes: 50 * 1024 * 1024,
      fileSizeBytes: 5,
      fileChecksum: `sha256:${"b".repeat(64)}`,
      expiresAt: new Date(Date.now() + 60_000),
      deletedAt: null,
    });
    download.mockResolvedValue({
      data: {
        arrayBuffer: async () => Buffer.from("hello"),
      },
      error: null,
    });

    await expect(getBackupBufferForSession("session_1", "admin_1")).rejects.toThrow(
      "Uploaded backup checksum does not match declared checksum"
    );

    expect(prismaMock.backupUploadSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "session_1" },
        data: expect.objectContaining({
          status: BackupUploadSessionStatus.FAILED,
        }),
      })
    );
  });

  it("never includes RESTORE_IN_PROGRESS sessions in cleanup candidates", async () => {
    prismaMock.backupUploadSession.findMany.mockResolvedValue([]);

    await cleanupExpiredBackupUploadSessions();

    const findManyCall = prismaMock.backupUploadSession.findMany.mock.calls[0][0];
    expect(findManyCall.where.status.in).toEqual(
      expect.arrayContaining([
        BackupUploadSessionStatus.PENDING_UPLOAD,
        BackupUploadSessionStatus.UPLOADED,
        BackupUploadSessionStatus.VALIDATED,
        BackupUploadSessionStatus.FAILED,
        BackupUploadSessionStatus.EXPIRED,
      ])
    );
    expect(findManyCall.where.status.in).not.toContain(BackupUploadSessionStatus.RESTORE_IN_PROGRESS);
  });

  it("keeps deletedAt null and increments failures when storage deletion returns error", async () => {
    prismaMock.backupUploadSession.findMany.mockResolvedValue([
      {
        id: "session_cleanup_1",
        bucket: "admin-backups-private",
        objectPath: "admin_1/path.strbk",
      },
    ]);
    remove.mockResolvedValue({
      error: { message: "remove failed" },
    });

    const result = await cleanupExpiredBackupUploadSessions();

    expect(result).toEqual({
      expiredSessions: 1,
      deletedObjects: 0,
      failures: 1,
    });
    expect(prismaMock.backupUploadSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "session_cleanup_1" },
        data: expect.objectContaining({
          status: BackupUploadSessionStatus.EXPIRED,
          deletedAt: null,
        }),
      })
    );
  });
});
