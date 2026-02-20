import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, sport, rows, cols, cellAnswers, timeLimit, status } = body;

        // Validation
        const errors: string[] = [];
        if (!title) errors.push("title is required");
        if (!rows || !Array.isArray(rows) || rows.length !== 3) errors.push("rows must be an array of 3 strings");
        if (!cols || !Array.isArray(cols) || cols.length !== 3) errors.push("cols must be an array of 3 strings");
        if (!cellAnswers || !Array.isArray(cellAnswers) || cellAnswers.length !== 3) {
            errors.push("cellAnswers must be a 3x3 array of strings");
        } else {
            for (let r = 0; r < 3; r++) {
                if (!Array.isArray(cellAnswers[r]) || cellAnswers[r].length !== 3) {
                    errors.push(`cellAnswers[${r}] must have 3 entries`);
                }
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
        }

        // Generate slug
        let slug = generateSlug(title);
        const existingSlug = await db.gridQuiz.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        const gridQuiz = await db.gridQuiz.create({
            data: {
                title,
                slug,
                description: description || null,
                sport: sport || null,
                status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
                size: 3,
                rows,
                cols,
                cellAnswers,
                timeLimit: timeLimit ? Number(timeLimit) : null,
            },
        });

        return NextResponse.json({
            data: { grid: gridQuiz },
            message: `Grid "${title}" created successfully.`,
        }, { status: 201 });

    } catch (error: any) {
        console.error("Error importing grid:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
