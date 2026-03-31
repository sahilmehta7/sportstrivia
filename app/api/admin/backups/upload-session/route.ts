import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { createBackupUploadSession } from "@/lib/services/backup-upload-session.service";

export const runtime = "nodejs";
export const maxDuration = 15;

const uploadSessionSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive(),
  contentType: z.string().optional(),
  fileChecksum: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const input = uploadSessionSchema.parse(await request.json().catch(() => ({})));

    const session = await createBackupUploadSession({
      actorId: admin.id,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      contentType: input.contentType,
      fileChecksum: input.fileChecksum,
    });

    return successResponse(session);
  } catch (error) {
    return handleError(error);
  }
}
