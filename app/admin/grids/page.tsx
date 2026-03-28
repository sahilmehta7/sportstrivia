import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminPaginationClient } from "@/components/admin/AdminPaginationClient";

export const dynamic = "force-dynamic";

interface GridsAdminPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GridsAdminPage({ searchParams }: GridsAdminPageProps) {
    const params = await searchParams;
    const page = Math.max(
        1,
        Number(typeof params?.page === "string" ? params.page : "1") || 1
    );
    const limit = Math.min(
        100,
        Math.max(1, Number(typeof params?.limit === "string" ? params.limit : "20") || 20)
    );
    const total = await db.gridQuiz.count();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const grids = await db.gridQuiz.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { attempts: true },
            },
        },
    });

    const hasPrevious = safePage > 1;
    const hasNext = safePage < totalPages;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Immaculate Grids</h1>
                    <p className="text-muted-foreground">Manage your 3×3 grid puzzles.</p>
                </div>
                <Link href="/admin/grids/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Grid
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Sport</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Attempts</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {grids.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No grids found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            grids.map((grid) => (
                                <TableRow key={grid.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/admin/grids/${grid.id}/edit`} className="hover:underline">
                                            {grid.title}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">{grid.slug}</div>
                                    </TableCell>
                                    <TableCell>{grid.sport || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={grid.status === "PUBLISHED" ? "default" : "secondary"}>
                                            {grid.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{grid._count.attempts}</TableCell>
                                    <TableCell>{new Date(grid.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/grids/${grid.id}/edit`}>
                                            <Button variant="ghost" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Showing{" "}
                    <span className="font-medium">
                        {grids.length === 0 ? 0 : skip + 1}-{skip + grids.length}
                    </span>{" "}
                    of <span className="font-medium">{total}</span>
                </div>
                <AdminPaginationClient
                    currentPage={safePage}
                    totalPages={totalPages}
                    hasPrevious={hasPrevious}
                    hasNext={hasNext}
                    variant="server"
                    filterParams={{ limit: limit.toString() }}
                />
            </div>
        </div>
    );
}
