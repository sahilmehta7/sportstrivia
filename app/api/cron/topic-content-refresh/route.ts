import { NextRequest, NextResponse } from "next/server";
import { runTopicContentRefreshJob } from "@/lib/jobs/topic-content-refresh.job";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedAuthHeader = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;

  if (process.env.NODE_ENV !== "development") {
    return Boolean(expectedAuthHeader && authHeader === expectedAuthHeader);
  }

  if (!expectedAuthHeader) return true;
  return authHeader === expectedAuthHeader;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limitParam = Number(new URL(request.url).searchParams.get("limit") || "50");
    const limit = Number.isFinite(limitParam) ? limitParam : 50;
    const summary = await runTopicContentRefreshJob(limit);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("[topic-content-refresh] failed", error);
    return NextResponse.json({ error: "Failed to refresh topic content" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
