import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gridService } from "@/lib/services/grid.service";
import { db } from "@/lib/db";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: _gridId } = await params;
        const body = await req.json();
        const { attemptId, cellRow, cellCol, answer } = body;

        if (!attemptId || cellRow === undefined || cellCol === undefined || !answer) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify attempt belongs to user
        const attempt = await db.gridAttempt.findUnique({
            where: { id: attemptId },
            include: { gridQuiz: true },
        });

        if (!attempt || attempt.userId !== session.user.id) {
            return NextResponse.json({ error: "Invalid attempt" }, { status: 403 });
        }

        const grid = attempt.gridQuiz;
        const cellRowIdx = Number(cellRow);
        const cellColIdx = Number(cellCol);

        // Validate Answer
        // grid.cellAnswers is Json: string[][]
        const cellAnswersMatrix = grid.cellAnswers as string[][];
        const validAnswers = cellAnswersMatrix?.[cellRowIdx]?.[cellColIdx]?.split("\n").map(s => s.trim().toLowerCase()) || [];

        const normalizedInput = answer.trim().toLowerCase();
        const isCorrect = validAnswers.includes(normalizedInput);

        // Calculate Rarity (Mocked for now)
        // In real app, we check QuestionAnswerStat or GridAnswer distribution
        const rarityScore = isCorrect ? Math.random() * 20 + 1 : undefined; // 1-20% mocked

        // Record Answer
        const cellId = `${cellRow}-${cellCol}`;
        await gridService.submitAnswer(attemptId, cellId, answer, isCorrect, rarityScore);

        // Update Attempt Score if correct
        if (isCorrect) {
            // Check if not already answered correctly?
            // For now, simple increment (though we should prevent double score)
            // Since cellId is unique in GridAnswer, we can just recount
            const correctAnswersCount = await db.gridAnswer.count({
                where: { attemptId, isValid: true }
            });
            await db.gridAttempt.update({
                where: { id: attemptId },
                data: { score: correctAnswersCount }
            });
        }

        return NextResponse.json({
            data: {
                isCorrect,
                rarity: rarityScore,
                message: isCorrect ? "Correct!" : "Incorrect",
            }
        });

    } catch (error) {
        console.error("Error submitting grid answer:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
