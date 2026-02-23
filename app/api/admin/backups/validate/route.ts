import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, BadRequestError, successResponse } from "@/lib/errors";
import { validateBackupBuffer } from "@/lib/services/backup-restore.service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new BadRequestError("Backup file is required");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const report = validateBackupBuffer(bytes);

    return successResponse(report, report.valid ? 200 : 400);
  } catch (error) {
    return handleError(error);
  }
}

