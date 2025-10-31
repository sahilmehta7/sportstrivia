"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShowcasePagination } from "@/components/showcase/ui/Pagination";
import Image from "next/image";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Trophy, TrendingUp, User as UserIcon } from "lucide-react";

interface UserProgress {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  totalPoints: number | null;
  currentLevel: number;
  currentTier: {
    id: number;
    name: string;
    slug: string;
  } | null;
  levelHistory: Array<{ level: number; reachedAt: Date }>;
  tierHistory: Array<{
    tierId: number;
    reachedAt: Date;
    tier: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
}

interface AdminUsersProgressClientProps {
  users: UserProgress[];
  stats: {
    totalUsers: number;
    usersWithLevels: number;
    averageLevel: number;
    highestLevel: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  search?: string;
}

export function AdminUsersProgressClient({
  users,
  stats,
  pagination,
  search: initialSearch,
}: AdminUsersProgressClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");

  useEffect(() => {
    setSearch(initialSearch ?? "");
  }, [initialSearch]);

  const updateQuery = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParamsHook.toString());
    if (value && value.length > 0) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset page when filters change
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(url);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateQuery("search", search || undefined);
  };

  const formatPoints = (points: number | null) => {
    if (points === null || points === 0) return "0";
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
    if (points >= 1000) return `${(points / 1000).toFixed(1)}k`;
    return points.toString();
  };

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = pagination.total === 0 ? 0 : startItem + users.length - 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Progress"
        description="View user levels, tiers, and progression"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Levels</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersWithLevels}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0
                ? Math.round((stats.usersWithLevels / stats.totalUsers) * 100)
                : 0}
              % of users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageLevel}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Level</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highestLevel}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search users by name or email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Progress ({pagination.total})</CardTitle>
          <CardDescription>
            {pagination.total === 0
              ? "No users to display"
              : `Showing ${startItem}-${endItem} of ${pagination.total} users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Total Points</TableHead>
                    <TableHead className="text-right">Level</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Last Level Reached</TableHead>
                    <TableHead>Last Tier Reached</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name || "User"}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <UserIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {user.name || "Anonymous"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPoints(user.totalPoints)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          {user.currentLevel > 0 ? `Lv. ${user.currentLevel}` : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.currentTier ? (
                          <Badge variant="default">{user.currentTier.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.levelHistory.length > 0
                          ? new Date(user.levelHistory[0].reachedAt).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.tierHistory.length > 0
                          ? new Date(user.tierHistory[0].reachedAt).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </div>
          <ShowcasePagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParamsHook.toString());
              params.set("page", String(page));
              const queryString = params.toString();
              router.push(queryString ? `${pathname}?${queryString}` : pathname);
            }}
          />
        </div>
      )}
    </div>
  );
}

