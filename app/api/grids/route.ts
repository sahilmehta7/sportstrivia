import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gridService } from "@/lib/services/grid.service";
import { z } from "zod";

const createGridSchema = z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    sport: z.string().optional(),
    size: z.number().int().min(2).max(5).default(3),
    rows: z.array(z.string()),
    cols: z.array(z.string()),
    timeLimit: z.number().int().positive().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = createGridSchema.parse(body);

        const grid = await gridService.createGrid({
            ...validatedData,
            rows: validatedData.rows as any, // Json type handling
            cols: validatedData.cols as any,
        });

        return NextResponse.json({ data: grid }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating grid:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const publishedOnly = searchParams.get("published") === "true";

        // If admin is requesting, they might want to see drafts
        const session = await auth();
        const isAdmin = session?.user?.role === "ADMIN";

        // If not admin, force publishedOnly to true
        const shouldFilter = !isAdmin || publishedOnly;

        const grids = await gridService.getAllGrids(shouldFilter);

        return NextResponse.json({ data: grids });
    } catch (error) {
        console.error("Error fetching grids:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
