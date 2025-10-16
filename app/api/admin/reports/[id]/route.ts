import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { z } from "zod";
import { ReportStatus } from "@prisma/client";
import { reportInclude } from "@/lib/dto/report-filters.dto";

const updateReportSchema = z.object({
  status: z.nativeEnum(ReportStatus),
});

// GET /api/admin/reports/[id] - Get report details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const report = await prisma.questionReport.findUnique({
      where: { id },
      include: reportInclude,
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    return successResponse({ report });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/reports/[id] - Update report status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status } = updateReportSchema.parse(body);

    const report = await prisma.questionReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    const updatedReport = await prisma.questionReport.update({
      where: { id },
      data: {
        status,
      },
      include: reportInclude,
    });

    return successResponse({
      report: updatedReport,
      message: "Report status updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/reports/[id] - Dismiss report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const report = await prisma.questionReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    await prisma.questionReport.delete({
      where: { id },
    });

    return successResponse({ message: "Report dismissed successfully" });
  } catch (error) {
    return handleError(error);
  }
}

