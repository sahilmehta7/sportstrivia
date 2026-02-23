import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { BACKUP_SUPPORTED_VERSIONS, BACKUP_VERSION } from "@/lib/backup/types";

export async function GET() {
  try {
    await requireAdmin();
    return successResponse({
      latestVersion: BACKUP_VERSION,
      supportedVersions: BACKUP_SUPPORTED_VERSIONS,
      format: "encrypted-json-snapshot",
    });
  } catch (error) {
    return handleError(error);
  }
}

