import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id } = await params;

        const quiz = await prisma.quiz.findUnique({
            where: { id },
        });

        if (!quiz) {
            throw new NotFoundError("Quiz not found");
        }

        // 1. Fetch all questions in the pool for this quiz
        const poolQuestions = await prisma.quizQuestionPool.findMany({
            where: { quizId: id },
            include: {
                question: {
                    select: {
                        topicId: true,
                        difficulty: true,
                    },
                },
            },
        });

        // 2. Aggregate counts by topic and difficulty
        const distribution = new Map<string, number>();

        for (const item of poolQuestions) {
            const key = `${item.question.topicId}:${item.question.difficulty}`;
            distribution.set(key, (distribution.get(key) || 0) + 1);
        }

        // 3. Update QuizTopicConfig in a transaction
        await prisma.$transaction(async (tx) => {
            // Clear existing configs
            await tx.quizTopicConfig.deleteMany({
                where: { quizId: id },
            });

            // Insert new configs
            for (const [key, count] of distribution.entries()) {
                const [topicId, difficulty] = key.split(":");
                if (topicId && difficulty) {
                    // Check if topic exists to be safe (referential integrity should handle this but good to be sure)
                    // Actually, if we rely on foreign keys, the insert will fail if topic is missing.
                    // Since we got topicId from existing questions, it should be fine.

                    await tx.quizTopicConfig.create({
                        data: {
                            quizId: id,
                            topicId: topicId,
                            difficulty: difficulty as any, // Cast to Difficulty enum type
                            questionCount: count,
                        }
                    })
                }
            }
        });

        return successResponse({
            message: "Topic configurations recomputed successfully",
            totalQuestions: poolQuestions.length,
            configCount: distribution.size
        });

    } catch (error) {
        return handleError(error);
    }
}
