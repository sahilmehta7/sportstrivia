import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gridService } from "@/lib/services/grid.service";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ attemptId: string }> }
) {
    try {
        const sessionPromise = auth();
        const { attemptId } = await params;
        const session = await sessionPromise;

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const attempt = await gridService.getAttempt(attemptId);

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        // Security: Only allow owner to see results?
        // In many sites, anyone with ID can see, but let's be strict for now if needed.
        // if (attempt.userId !== session.user.id) { ... }

        return NextResponse.json({ data: attempt });
    } catch (error) {
        console.error("Error fetching attempt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
