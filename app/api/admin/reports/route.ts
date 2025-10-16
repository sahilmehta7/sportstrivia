import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import {
  type ReportListFilters,
  buildReportWhereClause,
  reportInclude,
} from "@/lib/dto/report-filters.dto";
import { calculatePagination, buildPaginationResult } from "@/lib/dto/quiz-filters.dto";
import { ReportStatus } from "@prisma/client";

// GET /api/admin/reports - List all question reports
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const filters: ReportListFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      status: (searchParams.get("status") as ReportStatus) || undefined,
      category: searchParams.get("category") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const { skip, take } = calculatePagination(filters.page!, filters.limit!);
    const where = buildReportWhereClause(filters);

    const [reports, total, stats] = await Promise.all([
      prisma.questionReport.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: filters.sortOrder },
        include: reportInclude,
      }),
      prisma.questionReport.count({ where }),
      // Get status distribution
      prisma.questionReport.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return successResponse({
      reports,
      pagination: buildPaginationResult(filters.page!, filters.limit!, total),
      stats: {
        total,
        byStatus: Object.fromEntries(
          stats.map((s) => [s.status, s._count])
        ),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

