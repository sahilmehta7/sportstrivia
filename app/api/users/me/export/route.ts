import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError } from "@/lib/errors";

/**
 * GET /api/users/me/export - Export all user data
 * 
 * GDPR-compliant endpoint for users to export all their personal data.
 * Returns a JSON file containing all data associated with the user.
 */
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Fetch all user data with relations using separate queries for better type safety
        const [
            userData,
            accounts,
            quizAttempts,
            badges,
            friends,
            friendOf,
            challengesSent,
            challengesReceived,
            notifications,
            reviews,
            topicStats,
            levelHistory,
            tierHistory,
            searchQueries,
            notificationPreferences,
        ] = await Promise.all([
            // Core user data
            prisma.user.findUnique({
                where: { id: user.id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    bio: true,
                    image: true,
                    role: true,
                    favoriteTeams: true,
                    experienceTier: true,
                    totalPoints: true,
                    currentStreak: true,
                    longestStreak: true,
                    createdAt: true,
                    lastActiveDate: true,
                },
            }),

            // Auth accounts (omit tokens)
            prisma.account.findMany({
                where: { userId: user.id },
                select: {
                    provider: true,
                    type: true,
                },
            }),

            // Quiz attempts with answers
            prisma.quizAttempt.findMany({
                where: { userId: user.id },
                include: {
                    quiz: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                    userAnswers: {
                        select: {
                            questionId: true,
                            isCorrect: true,
                            wasSkipped: true,
                            timeSpent: true,
                            basePoints: true,
                            streakBonus: true,
                            timeBonus: true,
                            totalPoints: true,
                            createdAt: true,
                        },
                    },
                },
            }),

            // Badges
            prisma.userBadge.findMany({
                where: { userId: user.id },
                include: {
                    badge: {
                        select: {
                            name: true,
                            description: true,
                        },
                    },
                },
            }),

            // Friends (where user sent the request)
            prisma.friend.findMany({
                where: { userId: user.id },
                include: {
                    friend: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),

            // Friends (where user received the request)
            prisma.friend.findMany({
                where: { friendId: user.id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),

            // Challenges sent
            prisma.challenge.findMany({
                where: { challengerId: user.id },
                include: {
                    challenged: {
                        select: { name: true },
                    },
                    quiz: {
                        select: { title: true },
                    },
                },
            }),

            // Challenges received
            prisma.challenge.findMany({
                where: { challengedId: user.id },
                include: {
                    challenger: {
                        select: { name: true },
                    },
                    quiz: {
                        select: { title: true },
                    },
                },
            }),

            // Notifications
            prisma.notification.findMany({
                where: { userId: user.id },
                select: {
                    type: true,
                    content: true,
                    read: true,
                    createdAt: true,
                },
            }),

            // Reviews
            prisma.quizReview.findMany({
                where: { userId: user.id },
                include: {
                    quiz: {
                        select: { title: true },
                    },
                },
            }),

            // Topic stats
            prisma.userTopicStats.findMany({
                where: { userId: user.id },
                include: {
                    topic: {
                        select: {
                            name: true,
                            slug: true,
                        },
                    },
                },
            }),

            // Level history
            prisma.userLevel.findMany({
                where: { userId: user.id },
                select: {
                    level: true,
                    reachedAt: true,
                },
            }),

            // Tier history
            prisma.userTierHistory.findMany({
                where: { userId: user.id },
                include: {
                    tier: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),

            // Search history
            prisma.userSearchQuery.findMany({
                where: { userId: user.id },
                include: {
                    searchQuery: {
                        select: {
                            query: true,
                            context: true,
                        },
                    },
                },
            }),

            // Notification preferences
            prisma.userNotificationPreference.findUnique({
                where: { userId: user.id },
            }),
        ]);

        if (!userData) {
            return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Prepare export data with metadata
        const exportData = {
            exportDate: new Date().toISOString(),
            exportVersion: "1.1",
            user: userData,
            accounts,
            quizAttempts,
            badges,
            friends,
            friendOf,
            challengesSent,
            challengesReceived,
            notifications,
            reviews,
            topicStats,
            levelHistory,
            tierHistory,
            searchHistory: searchQueries,
            notificationPreferences,
        };

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `user-data-export-${timestamp}.json`;

        // Return as downloadable JSON file
        return new Response(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        return handleError(error);
    }
}
