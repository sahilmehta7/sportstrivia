import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { validateBackupBuffer } from "@/lib/services/backup-restore.service";
import {
  getBackupBufferForSession,
  markBackupUploadSessionValidated,
} from "@/lib/services/backup-upload-session.service";

export const runtime = "nodejs";
export const maxDuration = 120;

const validateSchema = z.object({
  uploadSessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = validateSchema.parse(await request.json().catch(() => ({})));
    const { bytes } = await getBackupBufferForSession(body.uploadSessionId, admin.id);
    const report = validateBackupBuffer(bytes);
    if (report.valid) {
      await markBackupUploadSessionValidated(body.uploadSessionId);
    }

    return successResponse(report, report.valid ? 200 : 400);
  } catch (error) {
    return handleError(error);
  }
}
