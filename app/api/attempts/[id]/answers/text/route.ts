import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import {
    handleError,
    successResponse,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} from "@/lib/errors";
import { z } from "zod";
import { normalizeAnswer, findBestMatch } from "@/lib/grid/fuzzy-match";
import { computeGridCellScore, getGridScoringConfig } from "@/lib/grid/grid-scoring";

const submitTextAnswerSchema = z.object({
    questionId: z.string().cuid(),
    textAnswer: z.string().min(1).max(200),
    timeSpent: z.number().int().min(0).max(3600),
});

function isUniqueConstraintError(error: unknown): boolean {
    return Boolean(
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
    );
}

/**
 * POST /api/attempts/[id]/answers/text
 *
 * Submit a typed text answer for a grid cell.
 * Server-side fuzzy matching against accepted answers.
 * Returns immediate feedback with rarity scoring.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Parallelize independent operations
        const [user, { id: attemptId }, body] = await Promise.all([
            requireAuth(),
            params,
            request.json(),
        ]);

        const { questionId, textAnswer, timeSpent } = submitTextAnswerSchema.parse(body);

        // Load attempt with quiz config
        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: attemptId },
            include: {
                quiz: {
                    select: {
                        id: true,
                        playMode: true,
                        playConfig: true,
                    } as any,
                },
            },
        }) as any;

        if (!attempt) {
            throw new NotFoundError("Quiz attempt not found");
        }

        if (attempt.userId !== user.id) {
            throw new UnauthorizedError();
        }

        if (attempt.completedAt) {
            throw new BadRequestError("Quiz attempt already completed");
        }

        if (attempt.quiz.playMode !== "GRID_3X3") {
            throw new BadRequestError("This endpoint is only for grid quizzes");
        }

        if (!attempt.selectedQuestionIds.includes(questionId)) {
            throw new BadRequestError("Question not part of this quiz attempt");
        }

        // Check for existing answer (idempotent)
        const existingAnswer = await prisma.userAnswer.findUnique({
            where: {
                attemptId_questionId: {
                    attemptId,
                    questionId,
                },
            },
        }) as any;

        if (existingAnswer) {
            return successResponse({
                questionId,
                isCorrect: existingAnswer.isCorrect,
                textAnswer: existingAnswer.textAnswer,
                alreadySubmitted: true,
                basePoints: existingAnswer.basePoints,
                rarityBonus: existingAnswer.totalPoints - existingAnswer.basePoints,
                totalPoints: existingAnswer.totalPoints,
            });
        }

        // Load accepted answers for this question
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                answers: {
                    where: { isCorrect: true },
                    select: { id: true, answerText: true },
                },
            },
        });

        if (!question) {
            throw new NotFoundError("Question not found");
        }

        // Parse grid scoring config
        const gridConfig = getGridScoringConfig(attempt.quiz.playConfig);

        // Fuzzy match against accepted answers
        const acceptedAnswers = question.answers.map((a) => ({
            id: a.id,
            text: a.answerText,
        }));

        const matchResult = findBestMatch(
            textAnswer,
            acceptedAnswers,
            gridConfig.fuzzyThreshold,
            gridConfig.minLength
        );

        const isCorrect = matchResult.matched;
        const matchedAnswerId = matchResult.matched ? matchResult.answerId : null;
        const matchedAnswerText = matchResult.matched ? matchResult.answerText : null;

        // Compute scoring for correct answers
        let basePoints = 0;
        let rarityBonus = 0;
        let totalPoints = 0;
        let rarity = 0;
        let pickedByPercent = 0;

        if (isCorrect) {
            const normalizedText = normalizeAnswer(matchedAnswerText!);

            // Get rarity stats from the database
            const [answerStat, allStats] = await Promise.all([
                (prisma as any).questionAnswerStat.findUnique({
                    where: {
                        questionId_normalizedAnswer: {
                            questionId,
                            normalizedAnswer: normalizedText,
                        },
                    },
                }),
                (prisma as any).questionAnswerStat.aggregate({
                    where: { questionId },
                    _sum: { correctCount: true },
                }),
            ]);

            const answerCorrectCount = (answerStat?.correctCount ?? 0);
            const totalCorrect = (allStats._sum.correctCount ?? 0);
            const K = acceptedAnswers.length || 10;

            const scoreResult = computeGridCellScore({
                basePoints: gridConfig.basePointsPerCell,
                rarityWeight: gridConfig.rarityWeight,
                answerCorrectCount,
                totalCorrect,
                K,
            });

            basePoints = scoreResult.basePoints;
            rarityBonus = scoreResult.rarityBonus;
            totalPoints = scoreResult.totalPoints;
            rarity = scoreResult.rarity;
            pickedByPercent = scoreResult.pickedByPercent;

            // Upsert the answer stat atomically
            await (prisma as any).questionAnswerStat.upsert({
                where: {
                    questionId_normalizedAnswer: {
                        questionId,
                        normalizedAnswer: normalizedText,
                    },
                },
                update: {
                    correctCount: { increment: 1 },
                },
                create: {
                    questionId,
                    normalizedAnswer: normalizedText,
                    correctCount: 1,
                },
            });
        }

        // Create the UserAnswer record
        try {
            await prisma.userAnswer.create({
                data: {
                    attemptId,
                    questionId,
                    answerId: matchedAnswerId,
                    isCorrect,
                    wasSkipped: false,
                    timeSpent,
                    textAnswer,
                    basePoints,
                    totalPoints,
                } as any,
            });
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                // Concurrent submission — return idempotent response
                const duplicate = await prisma.userAnswer.findUnique({
                    where: {
                        attemptId_questionId: { attemptId, questionId },
                    },
                }) as any;
                if (duplicate) {
                    return successResponse({
                        questionId,
                        isCorrect: duplicate.isCorrect,
                        textAnswer: duplicate.textAnswer,
                        alreadySubmitted: true,
                        basePoints: duplicate.basePoints,
                        rarityBonus: duplicate.totalPoints - duplicate.basePoints,
                        totalPoints: duplicate.totalPoints,
                    });
                }
            }
            throw error;
        }

        // Update question statistics in background
        after(async () => {
            await prisma.question.update({
                where: { id: questionId },
                data: {
                    timesAnswered: { increment: 1 },
                    ...(isCorrect && { timesCorrect: { increment: 1 } }),
                },
            });
        });

        return successResponse({
            questionId,
            isCorrect,
            alreadySubmitted: false,
            textAnswer,
            matchedAnswerId,
            matchedAnswerText,
            rarity,
            pickedByPercent,
            basePoints,
            rarityBonus,
            totalPoints,
        });
    } catch (error) {
        return handleError(error);
    }
}
