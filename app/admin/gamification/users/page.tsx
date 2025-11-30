import { prisma } from "@/lib/db";
import { computeLevelFromPoints, getTierForLevel } from "@/lib/services/gamification.service";
import { AdminUsersProgressClient } from "./AdminUsersProgressClient";

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

function getParamValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
}

export default async function UserProgressPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};

  const search = getParamValue(params.search);
  const pageParam = getParamValue(params.page);
  const limitParam = getParamValue(params.limit);

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 50) : 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { totalPoints: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        totalPoints: true,
        levelHistory: {
          orderBy: { reachedAt: "desc" },
          take: 1,
        },
        tierHistory: {
          orderBy: { reachedAt: "desc" },
          take: 1,
          include: {
            tier: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Compute current level/tier for each user
  const usersWithProgress = await Promise.all(
    users.map(async (user) => {
      const levelData = await computeLevelFromPoints(user.totalPoints ?? 0);
      const tierInfo = await getTierForLevel(levelData.level);
      return {
        ...user,
        currentLevel: levelData.level,
        currentTier: tierInfo,
      };
    })
  );

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  // Stats
  const stats = {
    totalUsers: total,
    usersWithLevels: usersWithProgress.filter((u) => u.currentLevel > 0).length,
    averageLevel: usersWithProgress.length > 0
      ? Math.round(
          usersWithProgress.reduce((sum, u) => sum + u.currentLevel, 0) /
            usersWithProgress.length
        )
      : 0,
    highestLevel: usersWithProgress.length > 0
      ? Math.max(...usersWithProgress.map((u) => u.currentLevel))
      : 0,
  };

  return (
    <AdminUsersProgressClient
      users={usersWithProgress}
      stats={stats}
      pagination={pagination}
      search={search}
    />
  );
}

