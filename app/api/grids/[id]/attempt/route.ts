import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gridService } from "@/lib/services/grid.service";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const attempt = await gridService.startAttempt(id, session.user.id);

        return NextResponse.json({ data: attempt }, { status: 201 });
    } catch (error) {
        console.error("Error starting grid attempt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
