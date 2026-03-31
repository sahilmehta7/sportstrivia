import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredBackupUploadSessions } from "@/lib/services/backup-upload-session.service";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedAuthHeader = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;

  if (process.env.NODE_ENV !== "development") {
    return !!expectedAuthHeader && authHeader === expectedAuthHeader;
  }

  if (!expectedAuthHeader) {
    return true;
  }

  return authHeader === expectedAuthHeader;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredBackupUploadSessions();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
