import { db } from "@/lib/db";
import {    Prisma } from "@prisma/client";

export const gridService = {
    // --- Admin / Management ---

    async createGrid(data: Prisma.GridQuizCreateInput) {
        return await db.gridQuiz.create({
            data,
        });
    },

    async updateGrid(id: string, data: Prisma.GridQuizUpdateInput) {
        return await db.gridQuiz.update({
            where: { id },
            data,
        });
    },

    async getGridById(id: string) {
        return await db.gridQuiz.findUnique({
            where: { id },
        });
    },

    async getGridBySlug(slug: string) {
        return await db.gridQuiz.findUnique({
            where: { slug },
        });
    },

    async getAllGrids(publishedOnly = true) {
        return await db.gridQuiz.findMany({
            where: publishedOnly ? { status: "PUBLISHED" } : {},
            orderBy: { createdAt: "desc" },
        });
    },

    // --- Gameplay / Attempts ---

    async startAttempt(gridQuizId: string, userId: string) {
        // Check if there is an existing active attempt? 
        // For now, simple logic: create new attempt
        return await db.gridAttempt.create({
            data: {
                gridQuizId,
                userId,
                startedAt: new Date(),
            },
        });
    },

    async getAttempt(attemptId: string) {
        return await db.gridAttempt.findUnique({
            where: { id: attemptId },
            include: {
                gridQuiz: true,
                answers: true,
            },
        });
    },

    async submitAnswer(attemptId: string, cellId: string, playerInput: string, isValid: boolean, rarityScore?: number) {
        // upsert allows updating a cell if user changes mind (though usually grid is one-shot per cell)
        // we'll use upsert to be safe
        return await db.gridAnswer.upsert({
            where: {
                attemptId_cellId: {
                    attemptId,
                    cellId,
                },
            },
            create: {
                attemptId,
                cellId,
                playerInput,
                isValid,
                rarityScore,
            },
            update: {
                playerInput,
                isValid,
                rarityScore,
            },
        });
    },

    async completeAttempt(attemptId: string, score: number, timeSpent: number, isGivenUp = false) {
        return await db.gridAttempt.update({
            where: { id: attemptId },
            data: {
                completedAt: new Date(),
                score,
                timeSpent,
                isGivenUp,
            },
        });
    },

    // --- Rarity Calculation (Placeholder / Logic Reuse) ---
    // In a real scenario, this would aggregate stats from `GridAnswer` table
    // For now, we stub or reuse existing logic if feasible.
};
