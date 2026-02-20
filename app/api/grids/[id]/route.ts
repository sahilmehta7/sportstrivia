import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gridService } from "@/lib/services/grid.service";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const grid = await gridService.getGridById(id);

        if (!grid) {
            return NextResponse.json({ error: "Grid not found" }, { status: 404 });
        }

        return NextResponse.json({ data: grid });
    } catch (error) {
        console.error("Error fetching grid:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const body = await req.json();

        const updatedGrid = await gridService.updateGrid(id, body);

        return NextResponse.json({ data: updatedGrid });
    } catch (error: any) {
        console.error("Error updating grid:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;

        await db.gridQuiz.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting grid:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
