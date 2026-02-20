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

export const dynamic = "force-dynamic";

export default async function GridsAdminPage() {
    const grids = await db.gridQuiz.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { attempts: true },
            },
        },
    });

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
        </div>
    );
}
