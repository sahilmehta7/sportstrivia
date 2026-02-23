import {
  BACKUP_MAGIC,
  BACKUP_VERSION,
  backupPayloadSchema,
  encryptedBackupEnvelopeSchema,
} from "@/lib/backup/types";

describe("backup schemas", () => {
  it("accepts valid backup payload", () => {
    const payload = {
      manifest: {
        magic: BACKUP_MAGIC,
        backupVersion: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        appVersion: "1.0.0",
        prismaMigrationState: [],
        rowCounts: { User: 1 },
        rowChecksums: { User: "abc" },
        storage: { totalObjects: 0, missingObjects: [] },
        checksum: "deadbeef",
        encryption: null,
      },
      data: {
        User: [{ id: "u_1", email: "u@example.com" }],
      },
      storage: [],
    };

    expect(() => backupPayloadSchema.parse(payload)).not.toThrow();
  });

  it("accepts encrypted envelope structure", () => {
    const envelope = {
      magic: BACKUP_MAGIC,
      version: BACKUP_VERSION,
      encryption: {
        alg: "aes-256-gcm",
        kdf: "pbkdf2-sha256",
        iterations: 210000,
        salt: "abc",
        iv: "abc",
        tag: "abc",
      },
      ciphertext: "abc",
    };

    expect(() => encryptedBackupEnvelopeSchema.parse(envelope)).not.toThrow();
  });
});

