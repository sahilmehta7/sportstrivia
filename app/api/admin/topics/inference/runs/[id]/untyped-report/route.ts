import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, NotFoundError } from "@/lib/errors";
import { getBackgroundTaskById } from "@/lib/services/background-task.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const task = await getBackgroundTaskById(id);
    if (!task || (task.userId && task.userId !== admin.id)) {
      throw new NotFoundError("Task not found");
    }

    const report = (task.result as any)?.artifacts?.untypedReport;
    if (!report) {
      throw new NotFoundError("Untyped report not found");
    }

    return new Response(report.content, {
      status: 200,
      headers: {
        "Content-Type": report.contentType,
        "Content-Disposition": `attachment; filename="${report.filename}"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
