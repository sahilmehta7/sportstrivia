import { AdminUsersClient } from "./AdminUsersClient";
import { prisma } from "@/lib/db";
import {
  buildPaginationResult,
  calculatePagination,
} from "@/lib/dto/quiz-filters.dto";
import {
  buildUserOrderBy,
  buildUserWhereClause,
  type UserListFilters,
  userListInclude,
} from "@/lib/dto/user-filters.dto";
import { UserRole } from "@prisma/client";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};

  const search = getParamValue(params.search);
  const roleParam = getParamValue(params.role);
  const sortByParam = getParamValue(params.sortBy) || "createdAt";
  const sortOrderParam = getParamValue(params.sortOrder) as "asc" | "desc" | undefined;
  const pageParam = getParamValue(params.page);
  const limitParam = getParamValue(params.limit);

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 20) : 20;

  const role = roleParam && Object.values(UserRole).includes(roleParam as UserRole)
    ? (roleParam as UserRole)
    : undefined;

  const allowedSortBy = new Set(["createdAt", "name", "streak", "attempts"]);
  const sortBy = allowedSortBy.has(sortByParam) ? (sortByParam as UserListFilters["sortBy"]) : "createdAt";
  const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";

  const filters: UserListFilters = {
    page,
    limit,
    search: search || undefined,
    role,
    sortBy,
    sortOrder,
  };

  const { skip, take } = calculatePagination(filters.page!, filters.limit!);
  const where = buildUserWhereClause(filters);
  const orderBy = buildUserOrderBy(filters.sortBy, filters.sortOrder);

  const [users, total, roleDistribution] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      include: userListInclude,
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),
  ]);

  const pagination = buildPaginationResult(filters.page!, filters.limit!, total);
  const stats = {
    total,
    byRole: Object.fromEntries(roleDistribution.map((r) => [r.role, r._count])),
  };

  return (
    <AdminUsersClient
      users={users}
      stats={stats}
      pagination={pagination}
      filters={{
        search: search || undefined,
        role: role || undefined,
        sortBy,
      }}
    />
  );
}
