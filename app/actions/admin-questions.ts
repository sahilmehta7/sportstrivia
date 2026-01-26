"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export type DuplicateRemovalResult = {
    success: boolean;
    totalFound: number;
    removed: number;
    skipped: number;
    error?: string;
    details?: string[];
};

export async function findAndRemoveDuplicateQuestions(): Promise<DuplicateRemovalResult> {
    try {
        await requireAdmin();

        // 1. Fetch all questions (id, text, createdAt)
        // For very large datasets, this should be paginated or done via raw SQL,
        // but for typical admin usage (<10k questions), this in-memory approach is acceptable and safer.
        const allQuestions = await prisma.question.findMany({
            select: {
                id: true,
                questionText: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "asc", // Oldest first
            },
        });

        // 2. Group by questionText
        const groups = new Map<string, typeof allQuestions>();

        for (const q of allQuestions) {
            // Normalize text: trim and lowercase for better matching
            const normalizedText = q.questionText.trim().toLowerCase();

            if (!groups.has(normalizedText)) {
                groups.set(normalizedText, []);
            }
            groups.get(normalizedText)!.push(q);
        }

        let totalFound = 0;
        let removed = 0;
        let skipped = 0;
        const details: string[] = [];

        // 3. Process duplicates
        for (const [text, questions] of groups.entries()) {
            if (questions.length <= 1) continue;

            // Found duplicates
            const duplicatesCount = questions.length - 1;
            totalFound += duplicatesCount;

            // Keep the first one (oldest because of query order)
            const [keep, ...toRemove] = questions;

            for (const q of toRemove) {
                try {
                    // Merge q (duplicate) into keep (original)
                    await prisma.$transaction(async (tx) => {
                        // 1. Map Answers
                        const origAnswers = await tx.answer.findMany({ where: { questionId: keep.id } });
                        const dupAnswers = await tx.answer.findMany({ where: { questionId: q.id } });

                        const answerMap = new Map<string, string>(); // dupAnswerId -> origAnswerId
                        for (const dAns of dupAnswers) {
                            const match = origAnswers.find(o =>
                                o.answerText.trim().toLowerCase() === dAns.answerText.trim().toLowerCase()
                            );
                            if (match) {
                                answerMap.set(dAns.id, match.id);
                            }
                        }

                        // 2. Move UserAnswers (Optimized)
                        const dupUserAnswers = await tx.userAnswer.findMany({ where: { questionId: q.id } });

                        if (dupUserAnswers.length > 0) {
                            const attemptIds = Array.from(new Set(dupUserAnswers.map(ua => ua.attemptId)));
                            // Batch fetch existing answers to the MAIN question in these attempts
                            const conflictAnswers = await tx.userAnswer.findMany({
                                where: {
                                    questionId: keep.id,
                                    attemptId: { in: attemptIds }
                                },
                                select: { attemptId: true }
                            });

                            const attemptIdsWithOrig = new Set(conflictAnswers.map(a => a.attemptId));

                            for (const ua of dupUserAnswers) {
                                if (attemptIdsWithOrig.has(ua.attemptId)) {
                                    // Conflict: delete duplicate answer
                                    await tx.userAnswer.delete({ where: { id: ua.id } });
                                } else {
                                    // No conflict: move to original
                                    const newAnswerId = ua.answerId ? answerMap.get(ua.answerId) : null;
                                    await tx.userAnswer.update({
                                        where: { id: ua.id },
                                        data: {
                                            questionId: keep.id,
                                            answerId: newAnswerId ?? null
                                        }
                                    });
                                }
                            }
                        }

                        // 3. Move QuizPools
                        const dupPools = await tx.quizQuestionPool.findMany({ where: { questionId: q.id } });
                        for (const pool of dupPools) {
                            const conflict = await tx.quizQuestionPool.findUnique({
                                where: { quizId_questionId: { quizId: pool.quizId, questionId: keep.id } }
                            });

                            if (conflict) {
                                // Redundant inclusion in same quiz
                                await tx.quizQuestionPool.delete({ where: { id: pool.id } });
                            } else {
                                await tx.quizQuestionPool.update({
                                    where: { id: pool.id },
                                    data: { questionId: keep.id }
                                });
                            }
                        }

                        // 4. Move Reports
                        await tx.questionReport.updateMany({
                            where: { questionId: q.id },
                            data: { questionId: keep.id }
                        });

                        // 5. Update QuizAttempts (selectedQuestionIds array)
                        // This identifies attempts that have the DUPLICATE question in their list
                        const attemptsWithDup = await tx.quizAttempt.findMany({
                            where: { selectedQuestionIds: { has: q.id } },
                            select: { id: true, selectedQuestionIds: true }
                        });

                        for (const attempt of attemptsWithDup) {
                            // Replace dup ID with original ID
                            const newIds = attempt.selectedQuestionIds.map(id =>
                                id === q.id ? keep.id : id
                            );
                            // Ensure uniqueness (in case both were present)
                            const uniqueIds = Array.from(new Set(newIds));

                            await tx.quizAttempt.update({
                                where: { id: attempt.id },
                                data: { selectedQuestionIds: uniqueIds }
                            });
                        }

                        // 6. Delete the Duplicate Question
                        await tx.question.delete({ where: { id: q.id } });
                    }, {
                        timeout: 20000, // Increase timeout to 20s
                        maxWait: 5000
                    });

                    removed++;
                    // Optional: Add details about merged dependencies if needed, 
                    // but for now we treat it as a successful removal.
                } catch (error: any) {
                    // Handle generic errors
                    console.error(`Failed to merge/delete question ${q.id}:`, error);
                    skipped++;
                    details.push(`Error merging "${q.questionText.substring(0, 30)}..." (ID: ${q.id}) - ${error.message}`);
                }
            }
        }

        revalidatePath("/admin/questions");

        return {
            success: true,
            totalFound,
            removed,
            skipped,
            details: details.length > 0 ? details.slice(0, 10) : undefined, // Return first 10 details to avoid huge payload
        };

    } catch (error: any) {
        console.error("Error in findAndRemoveDuplicateQuestions:", error);
        return {
            success: false,
            totalFound: 0,
            removed: 0,
            skipped: 0,
            error: error.message || "An unexpected error occurred",
        };
    }
}
