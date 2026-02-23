import { createCipheriv, createDecipheriv, createHash, pbkdf2Sync, randomBytes } from "crypto";
import { gzipSync, gunzipSync } from "zlib";
import {
  BACKUP_MAGIC,
  BACKUP_VERSION,
  encryptedBackupEnvelopeSchema,
  type EncryptedBackupEnvelope,
} from "@/lib/backup/types";

const KEY_ITERATIONS = 210_000;

function getEncryptionKeyMaterial(): string {
  const key = process.env.BACKUP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("BACKUP_ENCRYPTION_KEY is not configured");
  }
  return key;
}

function deriveKey(secret: string, salt: Buffer): Buffer {
  return pbkdf2Sync(secret, salt, KEY_ITERATIONS, 32, "sha256");
}

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function encryptBackupPayload(payload: Buffer): Buffer {
  const secret = getEncryptionKeyMaterial();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(secret, salt);
  const compressed = gzipSync(payload);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();

  const envelope: EncryptedBackupEnvelope = {
    magic: BACKUP_MAGIC,
    version: BACKUP_VERSION,
    encryption: {
      alg: "aes-256-gcm",
      kdf: "pbkdf2-sha256",
      iterations: KEY_ITERATIONS,
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
    },
    ciphertext: encrypted.toString("base64"),
  };

  return Buffer.from(JSON.stringify(envelope), "utf-8");
}

export function decryptBackupPayload(encryptedEnvelopeBytes: Buffer): Buffer {
  const secret = getEncryptionKeyMaterial();
  const parsed = encryptedBackupEnvelopeSchema.parse(
    JSON.parse(encryptedEnvelopeBytes.toString("utf-8"))
  );
  const salt = Buffer.from(parsed.encryption.salt, "base64");
  const iv = Buffer.from(parsed.encryption.iv, "base64");
  const tag = Buffer.from(parsed.encryption.tag, "base64");
  const ciphertext = Buffer.from(parsed.ciphertext, "base64");
  const key = deriveKey(secret, salt);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decryptedCompressed = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return gunzipSync(decryptedCompressed);
}
