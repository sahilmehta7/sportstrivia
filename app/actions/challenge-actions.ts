"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ChallengeStatus, Prisma } from "@prisma/client";

export async function searchQuizzes(query: string) {
    try {
        const quizzes = await prisma.quiz.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { sport: { contains: query, mode: "insensitive" } },
                ],
                status: "PUBLISHED",
            },
            take: 5,
            select: {
                id: true,
                title: true,
                sport: true,
                difficulty: true,
                description: true,
                questionCount: true,
            },
        });
        return quizzes;
    } catch (error) {
        console.error("Failed to search quizzes:", error);
        return [];
    }
}

export async function createChallenge(friendId: string, quizId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        // Check if a pending challenge already exists
        const existingChallenge = await prisma.challenge.findFirst({
            where: {
                challengerId: session.user.id,
                challengedId: friendId,
                quizId: quizId,
                status: "PENDING",
            },
        });

        if (existingChallenge) {
            return { error: "You have already challenged this friend to this quiz." };
        }

        // Get challenger's best score for this quiz to set as the target
        const challengerStats = await prisma.quizLeaderboard.findUnique({
            where: {
                quizId_userId: {
                    quizId: quizId,
                    userId: session.user.id,
                },
            },
        });

        const challenge = await prisma.challenge.create({
            data: {
                challengerId: session.user.id,
                challengedId: friendId,
                quizId: quizId,
                status: "PENDING",
                challengerScore: challengerStats?.bestScore || 0,
            },
        });

        // Create a notification for the challenged user
        await prisma.notification.create({
            data: {
                userId: friendId,
                type: "CHALLENGE_RECEIVED",
                content: `${session.user.name || "A friend"} has challenged you to a quiz!`,
            },
        });

        revalidatePath("/friends");
        return { success: true, challenge };
    } catch (error) {
        console.error("Failed to create challenge:", error);
        return { error: "Failed to create challenge" };
    }
}

export async function respondToChallenge(challengeId: string, action: "accept" | "decline") {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId },
        });

        if (!challenge) {
            return { error: "Challenge not found" };
        }

        if (challenge.challengedId !== session.user.id) {
            return { error: "Unauthorized" };
        }

        const newStatus = action === "accept" ? ChallengeStatus.ACCEPTED : ChallengeStatus.DECLINED;

        await prisma.challenge.update({
            where: { id: challengeId },
            data: { status: newStatus },
        });

        if (action === "accept") {
            // Notify challenger
            await prisma.notification.create({
                data: {
                    userId: challenge.challengerId,
                    type: "CHALLENGE_ACCEPTED",
                    content: `${session.user.name || "Your friend"} accepted your challenge!`,
                },
            });
        }

        revalidatePath("/friends");
        revalidatePath("/quizzes");
        return { success: true };
    } catch (error) {
        console.error("Failed to respond to challenge:", error);
        return { error: "Failed to update challenge" };
    }
}

export async function getPendingChallenges() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const challenges = await prisma.challenge.findMany({
            where: {
                challengedId: session.user.id,
                status: "PENDING",
            },
            include: {
                challenger: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        difficulty: true,
                        sport: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return challenges;
    } catch (error) {
        console.error("Failed to fetch pending challenges:", error);
        return [];
    }
}
