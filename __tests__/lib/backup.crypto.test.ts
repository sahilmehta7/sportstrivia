import { decryptBackupPayload, encryptBackupPayload } from "@/lib/backup/crypto";
import { BACKUP_MAGIC } from "@/lib/backup/types";

describe("backup crypto", () => {
  const previous = process.env.BACKUP_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.BACKUP_ENCRYPTION_KEY = "test-backup-encryption-key-123";
  });

  afterAll(() => {
    process.env.BACKUP_ENCRYPTION_KEY = previous;
  });

  it("encrypts and decrypts payload bytes", () => {
    const original = Buffer.from(JSON.stringify({ hello: "world", count: 2 }), "utf-8");
    const encrypted = encryptBackupPayload(original);
    const decrypted = decryptBackupPayload(encrypted);

    expect(decrypted.toString("utf-8")).toBe(original.toString("utf-8"));
  });

  it("produces envelope with expected magic", () => {
    const original = Buffer.from("payload", "utf-8");
    const encrypted = encryptBackupPayload(original);
    const parsed = JSON.parse(encrypted.toString("utf-8")) as { magic: string };

    expect(parsed.magic).toBe(BACKUP_MAGIC);
  });

  it("fails when ciphertext is tampered", () => {
    const original = Buffer.from("important", "utf-8");
    const encrypted = encryptBackupPayload(original);
    const parsed = JSON.parse(encrypted.toString("utf-8")) as { ciphertext: string };
    const mutated = parsed.ciphertext.slice(0, -4) + "ABCD";
    parsed.ciphertext = mutated;

    expect(() =>
      decryptBackupPayload(Buffer.from(JSON.stringify(parsed), "utf-8"))
    ).toThrow();
  });
});

