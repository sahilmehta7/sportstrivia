import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { applyProgression, type TierProgress } from "@/lib/services/progression.service";
import { computeQuizScale } from "@/lib/scoring/computeQuizScale";
import { computeQuestionScore } from "@/lib/scoring/computeQuestionScore";
import { awardCompletionBonusIfEligible } from "@/lib/services/awardCompletionBonus";
import type { Prisma } from "@prisma/client";
import { checkAndAwardBadges } from "@/lib/services/badge.service";
import { recomputeUserProgress } from "@/lib/services/gamification.service";
import { createNotification } from "@/lib/services/notification.service";
import { z } from "zod";

const quizSelection = {
    id: true,
    title: true,
    slug: true,
    passingScore: true,
    completionBonus: true,
    timePerQuestion: true,
    sport: true,
    topicConfigs: {
        select: {
            topicId: true
        }
    }
} as const;

const userAnswerSelection = {
    include: {
        question: {
            select: {
                id: true,
                questionText: true,
                explanation: true,
                explanationImageUrl: true,
                explanationVideoUrl: true,
                timeLimit: true,
                difficulty: true,
            },
        },
        answer: true,
    },
} as const;

type AttemptWithDetails = Prisma.QuizAttemptGetPayload<{
    include: {
        quiz: {
            select: typeof quizSelection;
        };
        userAnswers: typeof userAnswerSelection;
    };
}>;

const completeAttemptSchema = z.object({
    answers: z.array(z.object({
        questionId: z.string().cuid(),
        answerId: z.string().cuid().nullable(),
        timeSpent: z.number().int().min(0).max(3600),
    })).max(500).optional(),
});

// GET /api/attempts/[id] - Get attempt results
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const attempt = await prisma.quizAttempt.findUnique({
            where: { id },
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        passingScore: true,
                        answersRevealTime: true,
                        timePerQuestion: true,
                    },
                },
                userAnswers: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                questionText: true,
                                questionImageUrl: true,
                                explanation: true,
                                explanationImageUrl: true,
                                explanationVideoUrl: true,
                                timeLimit: true,
                            },
                        },
                        answer: {
                            select: {
                                id: true,
                                answerText: true,
                                answerImageUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!attempt) {
            throw new NotFoundError("Quiz attempt not found");
        }

        // Verify ownership
        if (attempt.userId !== user.id) {
            throw new UnauthorizedError();
        }

        // Check if answers should be revealed
        const now = new Date();
        const revealAnswers =
            attempt.completedAt &&
            (!attempt.quiz.answersRevealTime ||
                attempt.quiz.answersRevealTime <= now);

        // Get correct answers if they should be revealed
        const correctAnswersMap = new Map<string, { id: string; answerText: string; answerImageUrl: string | null }>();
        if (revealAnswers) {
            const questionIds = attempt.userAnswers.map((ua) => ua.questionId);
            const questions = await prisma.question.findMany({
                where: { id: { in: questionIds } },
                include: {
                    answers: {
                        where: { isCorrect: true },
                        select: {
                            id: true,
                            answerText: true,
                            answerImageUrl: true,
                        },
                    },
                },
            });

            for (const question of questions) {
                const correctAnswer = question.answers[0];
                if (correctAnswer) {
                    correctAnswersMap.set(question.id, correctAnswer);
                }
            }
        }

        const response = {
            attempt: {
                id: attempt.id,
                quizId: attempt.quizId,
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                correctAnswers: attempt.correctAnswers,
                passed: attempt.passed,
                totalPoints: attempt.totalPoints,
                longestStreak: attempt.longestStreak,
                averageResponseTime: attempt.averageResponseTime,
                totalTimeSpent: attempt.totalTimeSpent,
                startedAt: attempt.startedAt,
                completedAt: attempt.completedAt,
                isPracticeMode: attempt.isPracticeMode,
            },
            quiz: attempt.quiz,
            revealAnswers,
            answers: attempt.userAnswers.map((ua) => ({
                questionId: ua.questionId,
                questionText: ua.question.questionText,
                questionImageUrl: ua.question.questionImageUrl,
                userAnswer: ua.answer,
                isCorrect: ua.isCorrect,
                wasSkipped: ua.wasSkipped,
                timeSpent: ua.timeSpent,
                basePoints: ua.basePoints,
                timeBonus: ua.timeBonus,
                streakBonus: ua.streakBonus,
                totalPoints: ua.totalPoints,
                timeLimit: ua.question.timeLimit ?? attempt.quiz.timePerQuestion ?? 60,
                ...(revealAnswers && {
                    correctAnswer: correctAnswersMap.get(ua.questionId),
                    explanation: ua.question.explanation,
                    explanationImageUrl: ua.question.explanationImageUrl,
                    explanationVideoUrl: ua.question.explanationVideoUrl,
                }),
            })),
        };

        return successResponse(response);
    } catch (error) {
        return handleError(error);
    }
}

// PATCH /api/attempts/[id] - Complete quiz attempt and calculate score
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const body = await request.json().catch(() => ({}));
        const { answers: batchedAnswers } = completeAttemptSchema.parse(body);

        // Get attempt with answers
        const attempt = await prisma.quizAttempt.findUnique({
            where: { id },
            include: {
                quiz: { select: quizSelection },
                userAnswers: userAnswerSelection,
            },
        });

        if (!attempt) {
            throw new NotFoundError("Quiz attempt not found");
        }

        // Verify ownership
        if (attempt.userId !== user.id) {
            throw new ForbiddenError("You do not have permission to complete this quiz attempt");
        }

        // Check if already completed
        if (attempt.completedAt) {
            return successResponse({
                awardedBadges: [],
                progression: null,
                completionBonusAwarded: null,
                bonusStatus: "APPLIED" as const,
                attempt: {
                    id: attempt.id,
                    quizId: attempt.quizId,
                    quizSlug: attempt.quiz.slug,
                    score: attempt.score,
                    passed: attempt.passed
                }
            });
        }

        if (batchedAnswers && Array.isArray(batchedAnswers) && batchedAnswers.length > 0) {
            const validQuestions = attempt.selectedQuestionIds;
            const uniqueBatchedAnswers = new Map<string, {
                questionId: string;
                answerId: string | null;
                timeSpent: number;
            }>();

            for (const answer of batchedAnswers) {
                if (!validQuestions.includes(answer.questionId)) continue;
                if (!uniqueBatchedAnswers.has(answer.questionId)) {
                    uniqueBatchedAnswers.set(answer.questionId, answer);
                }
            }

            const questionIds = Array.from(uniqueBatchedAnswers.keys());

            const questions = await prisma.question.findMany({
                where: { id: { in: questionIds } },
                include: { answers: true },
            });

            const questionMap = new Map(questions.map(q => [q.id, q]));

            const alreadyAnswered = new Set(attempt.userAnswers.map((ua) => ua.questionId));
            const answersToCreate = Array.from(uniqueBatchedAnswers.values())
                .map(answer => {
                    const question = questionMap.get(answer.questionId);
                    if (!question || alreadyAnswered.has(answer.questionId)) return null;

                    const correctAnswer = question.answers.find(a => a.isCorrect);
                    const isCorrect = answer.answerId === correctAnswer?.id;
                    const wasSkipped = answer.answerId === null;

                    return {
                        attemptId: id,
                        questionId: answer.questionId,
                        answerId: answer.answerId,
                        isCorrect,
                        wasSkipped,
                        timeSpent: answer.timeSpent,
                    };
                })
                .filter((data): data is NonNullable<typeof data> => data !== null);

            if (answersToCreate.length > 0) {
                await prisma.userAnswer.createMany({
                    data: answersToCreate,
                    skipDuplicates: true,
                });
            }
        }

        // Refresh attempt data with newly inserted answers
        const updatedAttempt = await prisma.quizAttempt.findUnique({
            where: { id },
            include: {
                quiz: { select: quizSelection },
                userAnswers: userAnswerSelection,
            },
        });

        if (!updatedAttempt) throw new Error("Failed to reload attempt");

        const orderedAnswersByCreatedAt = [...updatedAttempt.userAnswers].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const uniqueAnswersByQuestion = new Map<string, (typeof orderedAnswersByCreatedAt)[number]>();
        for (const answer of orderedAnswersByCreatedAt) {
            if (!uniqueAnswersByQuestion.has(answer.questionId)) {
                uniqueAnswersByQuestion.set(answer.questionId, answer);
            }
        }
        const orderedAnswers = Array.from(uniqueAnswersByQuestion.values());

        // Precompute quiz scale based on quiz completionBonus and selected questions' configuration
        const questionConfigs = orderedAnswers.map((ua) => ({
            difficulty: ua.question.difficulty,
            timeLimitSeconds: ua.question.timeLimit ?? updatedAttempt.quiz.timePerQuestion ?? 60,
        }));
        const quizScale = computeQuizScale({
            completionBonus: updatedAttempt.quiz.completionBonus ?? 0,
            questions: questionConfigs,
        });

        let totalPoints = 0;
        let totalTimeSpent = 0;
        let correctAnswers = 0;
        // Streak is not part of the new scoring; keep for backward-compatible fields
        let currentStreak = 0;
        let longestStreak = 0;

        const answerScoreData: {
            id: string;
            basePoints: number;
            timeBonus: number;
            streakBonus: number;
            totalPoints: number;
        }[] = [];

        for (let index = 0; index < orderedAnswers.length; index += 1) {
            const userAnswer = orderedAnswers[index];
            const questionConfig = questionConfigs[index];
            const questionTimeLimit = questionConfig.timeLimitSeconds ?? updatedAttempt.quiz.timePerQuestion ?? 60;

            totalTimeSpent += userAnswer.timeSpent;

            let basePoints = 0;
            let timeBonus = 0;
            let streakBonus = 0;
            let totalForQuestion = 0;

            if (userAnswer.isCorrect && !userAnswer.wasSkipped) {
                // New scoring formula: difficulty-weighted, time-decayed within limit
                const computed = computeQuestionScore({
                    isCorrect: true,
                    responseTimeSeconds: userAnswer.timeSpent,
                    timeLimitSeconds: questionTimeLimit,
                    difficulty: userAnswer.question.difficulty,
                    quizScale,
                });
                // Store computed points in timeBonus for UI continuity; base/streak remain 0
                timeBonus = computed;
                totalForQuestion = computed;
                correctAnswers += 1;
                // Maintain legacy streak tracking for stats, not scoring
                currentStreak += 1;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }

            totalPoints += totalForQuestion;

            answerScoreData.push({
                id: userAnswer.id,
                basePoints,
                timeBonus,
                streakBonus,
                totalPoints: totalForQuestion,
            });
            // Analytics logging removed for production
        }

        totalPoints = Math.round(totalPoints);

        const answeredCount = orderedAnswers.length;
        const averageResponseTime =
            answeredCount > 0 ? totalTimeSpent / answeredCount : 0;

        const totalQuestions = updatedAttempt.totalQuestions || answeredCount;
        const scorePercentage =
            totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const passed = scorePercentage >= updatedAttempt.quiz.passingScore;

        const completedAttempt = await prisma.$transaction(
            async (tx) => {
                await Promise.all(
                    answerScoreData.map((answer) =>
                        tx.userAnswer.update({
                            where: { id: answer.id },
                            data: {
                                basePoints: answer.basePoints,
                                timeBonus: answer.timeBonus,
                                streakBonus: answer.streakBonus,
                                totalPoints: answer.totalPoints,
                            },
                        })
                    )
                );

                const completionUpdate = await tx.quizAttempt.updateMany({
                    where: { id, completedAt: null },
                    data: {
                        score: scorePercentage,
                        correctAnswers,
                        passed,
                        completedAt: new Date(),
                        totalPoints,
                        longestStreak,
                        averageResponseTime,
                        totalTimeSpent,
                    },
                });
                if (completionUpdate.count === 0) {
                    return null;
                }
                return tx.quizAttempt.findUnique({
                    where: { id },
                    include: {
                        quiz: { select: quizSelection },
                        userAnswers: userAnswerSelection,
                    },
                });
            },
            {
                timeout: 20000,
            }
        );

        if (!completedAttempt) {
            const latestAttempt = await prisma.quizAttempt.findUnique({
                where: { id },
                include: { quiz: { select: quizSelection } },
            });
            if (!latestAttempt) {
                throw new NotFoundError("Quiz attempt not found");
            }
            return successResponse({
                awardedBadges: [],
                progression: null,
                completionBonusAwarded: null,
                bonusStatus: "APPLIED" as const,
                attempt: {
                    id: latestAttempt.id,
                    quizId: latestAttempt.quizId,
                    quizSlug: latestAttempt.quiz.slug,
                    score: latestAttempt.score,
                    passed: latestAttempt.passed
                }
            });
        }

        // Calculate elapsed time for leaderboard (needed before parallel execution)
        const totalElapsedSeconds = Math.floor(
            (new Date().getTime() - attempt.startedAt.getTime()) / 1000
        );

        after(async () => {
            try {
                // 1. Award completion bonus
                let bonus = 0;
                if (passed && !attempt.isPracticeMode) {
                    bonus = await awardCompletionBonusIfEligible({
                        userId: user.id,
                        quizId: attempt.quizId,
                    });
                    if (bonus > 0) {
                        // Update attempt total points with bonus
                        await prisma.quizAttempt.update({
                            where: { id: completedAttempt.id },
                            data: { totalPoints: completedAttempt.totalPoints + bonus },
                        });
                    }
                }

                const finalPoints = totalPoints + bonus;

                // 2. Run other updates in parallel
                await Promise.allSettled([
                    updateUserStatistics(
                        user.id,
                        attempt.quizId,
                        completedAttempt,
                        finalPoints
                    ),
                    attempt.isPracticeMode
                        ? Promise.resolve(null)
                        : updateQuizLeaderboard(
                            user.id,
                            attempt.quizId,
                            scorePercentage,
                            finalPoints,
                            averageResponseTime,
                            totalElapsedSeconds
                        ),
                    checkAndAwardBadges(user.id, {
                        quizId: attempt.quizId,
                        topicId: attempt.quiz.topicConfigs[0]?.topicId,
                        sport: attempt.quiz.sport || undefined,
                        score: scorePercentage,
                        isPracticeMode: attempt.isPracticeMode
                    }),
                    recomputeUserProgress(user.id)
                ]);
            } catch (err) {
                console.error("Background task error:", err);
            }
        });

        return successResponse({
            awardedBadges: [],
            progression: null,
            completionBonusAwarded: null,
            bonusStatus: "PENDING" as const,
            attempt: {
                id: completedAttempt.id,
                quizId: completedAttempt.quizId,
                quizSlug: completedAttempt.quiz.slug,
                score: completedAttempt.score,
                passed: completedAttempt.passed
            }
        });
    } catch (error) {
        return handleError(error);
    }
}

// Helper function to update user statistics
async function updateUserStatistics(
    userId: string,
    quizId: string,
    attempt: any,
    pointsEarned: number
): Promise<TierProgress> {
    // Update user streak
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
            totalPoints: true,
            experienceTier: true,
        },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user?.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastActive) {
        lastActive.setHours(0, 0, 0, 0);
    }

    const previousStreak = user?.currentStreak ?? 0;
    const previousLongestStreak = user?.longestStreak ?? 0;

    let newStreak = previousStreak;
    let newLongestStreak = previousLongestStreak;

    if (!lastActive || lastActive.getTime() !== today.getTime()) {
        if (lastActive) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastActive.getTime() === yesterday.getTime()) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }
        } else {
            newStreak = 1;
        }
    }

    newLongestStreak = Math.max(newLongestStreak, newStreak);

    const userUpdateOverrides: Prisma.UserUpdateInput = {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: new Date(),
    };

    // Fetch all questions in batch
    const questionIds = attempt.userAnswers.map((ua: { questionId: string }) => ua.questionId);
    const questions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, topicId: true },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q.topicId]));

    // Group answers by topic for batch processing
    const topicAnswerMap = new Map<string, { correct: number; total: number; totalTime: number }>();

    for (const userAnswer of attempt.userAnswers) {
        const topicId = questionMap.get(userAnswer.questionId);
        if (!topicId) continue;

        const stats = topicAnswerMap.get(topicId) || { correct: 0, total: 0, totalTime: 0 };
        stats.total++;
        if (userAnswer.isCorrect) stats.correct++;
        stats.totalTime += userAnswer.timeSpent;
        topicAnswerMap.set(topicId, stats);
    }

    // Fetch existing topic stats in batch
    const topicIds = Array.from(topicAnswerMap.keys());
    const existingTopicStats = await prisma.userTopicStats.findMany({
        where: {
            userId,
            topicId: { in: topicIds },
        },
    });

    const existingStatsMap = new Map(existingTopicStats.map((s) => [s.topicId, s]));

    // Prepare batch updates and creates
    const updates = [];
    const creates = [];

    for (const [topicId, stats] of topicAnswerMap.entries()) {
        const existing = existingStatsMap.get(topicId);

        if (existing) {
            const newQuestionsAnswered = existing.questionsAnswered + stats.total;
            const newQuestionsCorrect = existing.questionsCorrect + stats.correct;
            const newSuccessRate = (newQuestionsCorrect / newQuestionsAnswered) * 100;
            const newAverageTime =
                (existing.averageTime * existing.questionsAnswered + stats.totalTime) /
                newQuestionsAnswered;

            updates.push(
                prisma.userTopicStats.update({
                    where: { id: existing.id },
                    data: {
                        questionsAnswered: newQuestionsAnswered,
                        questionsCorrect: newQuestionsCorrect,
                        successRate: newSuccessRate,
                        averageTime: newAverageTime,
                        lastAnsweredAt: new Date(),
                    },
                })
            );
        } else {
            creates.push(
                prisma.userTopicStats.create({
                    data: {
                        userId,
                        topicId,
                        questionsAnswered: stats.total,
                        questionsCorrect: stats.correct,
                        successRate: (stats.correct / stats.total) * 100,
                        averageTime: stats.totalTime / stats.total,
                        lastAnsweredAt: new Date(),
                    },
                })
            );
        }
    }

    // Execute all updates and creates in parallel
    await Promise.all([...updates, ...creates]);

    if (newStreak > previousStreak) {
        const body =
            newLongestStreak > previousLongestStreak
                ? `New personal best! You're on a ${newStreak}-day streak.`
                : newStreak === 1
                    ? "Streak started! Come back tomorrow to keep it alive."
                    : `Your ${newStreak}-day streak is alive. Keep it going!`;

        await createNotification(
            userId,
            "STREAK_UPDATED",
            {
                streak: newStreak,
                longestStreak: newLongestStreak,
            },
            {
                push: {
                    title: "Streak update",
                    body,
                    url: "/profile/me",
                    tag: `streak:${today.toISOString().slice(0, 10)}`,
                    data: {
                        streak: newStreak,
                        longestStreak: newLongestStreak,
                    },
                },
            }
        );
    }

    const progression = await applyProgression(
        userId,
        pointsEarned,
        userUpdateOverrides,
        user
            ? {
                totalPoints: user.totalPoints ?? 0,
                experienceTier: user.experienceTier,
            }
            : undefined
    );

    return progression;
}

// Helper function to update quiz leaderboard
async function updateQuizLeaderboard(
    userId: string,
    quizId: string,
    score: number,
    points: number,
    averageResponseTime: number,
    totalTime: number
) {
    const existing = await prisma.quizLeaderboard.findUnique({
        where: {
            quizId_userId: {
                quizId,
                userId,
            },
        },
    });

    if (existing) {
        const isBetterAttempt =
            points > existing.bestPoints ||
            (points === existing.bestPoints &&
                (existing.averageResponseTime === 0 || averageResponseTime < existing.averageResponseTime));

        if (isBetterAttempt) {
            await prisma.quizLeaderboard.update({
                where: { id: existing.id },
                data: {
                    bestScore: Math.max(score, existing.bestScore),
                    bestTime: existing.bestTime === 0 ? totalTime : Math.min(totalTime, existing.bestTime),
                    bestPoints: points,
                    averageResponseTime: averageResponseTime,
                    attempts: { increment: 1 },
                    // Don't update rank here, it will be calculated on read
                },
            });
        } else {
            await prisma.quizLeaderboard.update({
                where: { id: existing.id },
                data: {
                    attempts: { increment: 1 },
                },
            });
        }
    } else {
        // New entry
        await prisma.quizLeaderboard.create({
            data: {
                quizId,
                userId,
                bestScore: score,
                bestTime: totalTime,
                bestPoints: points,
                averageResponseTime,
                attempts: 1,
                // rank: 0, // Removed usage as per previous schema change optimization? 
                // Wait, schema change REMOVED the unique constraint.
                // But did I remove the 'rank' field itself? 
                // Checking schema in step 114, rank is still there in QuizLeaderboard (Step 23 showed it).
                // My optimization in step 52 ADDED "rank: 0" back? 
                // Step 52 replace content showed: `rank: 0, // Placeholder` added.
                // So yes, I should include it.
                rank: 0,
            },
        });
    }
}
