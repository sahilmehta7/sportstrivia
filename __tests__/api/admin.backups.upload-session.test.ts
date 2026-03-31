/** @jest-environment node */

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/services/backup-upload-session.service", () => ({
  BACKUP_UPLOAD_MAX_BYTES: 50 * 1024 * 1024,
  createBackupUploadSession: jest.fn(),
}));

import { requireAdmin } from "@/lib/auth-helpers";
import { createBackupUploadSession } from "@/lib/services/backup-upload-session.service";
import { POST } from "@/app/api/admin/backups/upload-session/route";

describe("POST /api/admin/backups/upload-session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1", role: "ADMIN" });
  });

  it("creates an upload session for admin", async () => {
    (createBackupUploadSession as jest.Mock).mockResolvedValue({
      uploadSessionId: "session_1",
      bucket: "admin-backups-private",
      objectPath: "admin_1/backup.strbk",
      uploadToken: "token_1",
      signedUploadUrl: "https://example.test/upload",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      maxBytes: 50 * 1024 * 1024,
    });

    const request = new Request("http://localhost/api/admin/backups/upload-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "backup.strbk",
        fileSizeBytes: 1024,
        contentType: "application/octet-stream",
      }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.uploadSessionId).toBe("session_1");
    expect(createBackupUploadSession).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin_1",
        fileName: "backup.strbk",
      })
    );
  });
});
