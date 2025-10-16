import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import {
  type UserListFilters,
  buildUserWhereClause,
  buildUserOrderBy,
  userListInclude,
} from "@/lib/dto/user-filters.dto";
import { calculatePagination, buildPaginationResult } from "@/lib/dto/quiz-filters.dto";
import { UserRole } from "@prisma/client";

// GET /api/admin/users - List all users with filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    // Parse filters with type safety
    const filters: UserListFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      search: searchParams.get("search") || undefined,
      role: (searchParams.get("role") as UserRole) || undefined,
      hasStreak: searchParams.get("hasStreak") === "true",
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const { skip, take } = calculatePagination(filters.page!, filters.limit!);
    const where = buildUserWhereClause(filters);
    const orderBy = buildUserOrderBy(filters.sortBy, filters.sortOrder);

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: userListInclude,
      }),
      prisma.user.count({ where }),
    ]);

    // Get role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    return successResponse({
      users,
      pagination: buildPaginationResult(filters.page!, filters.limit!, total),
      stats: {
        total,
        byRole: Object.fromEntries(
          roleDistribution.map((r) => [r.role, r._count])
        ),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

