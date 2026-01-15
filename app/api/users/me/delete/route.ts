import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";

/**
 * DELETE /api/users/me/delete - Delete current user's account
 * 
 * GDPR-compliant endpoint for users to delete their own accounts.
 * Uses cascading deletes defined in the Prisma schema to remove all related data.
 */
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // The User model has onDelete: Cascade set on most relations,
            // so deleting the user will cascade to related records:
            // - Accounts, Sessions
            // - QuizAttempts (and their UserAnswers)
            // - QuizLeaderboard entries
            // - QuizReviews
            // - Friends (both directions via userId and friendId)
            // - Challenges (both directions)
            // - Notifications
            // - UserBadges
            // - UserTopicStats
            // - UserLevel, UserTierHistory
            // - PushSubscriptions
            // - UserNotificationPreference
            // - SearchQueries
            // - MediaUploads
            // - AdminBackgroundTasks (set to null for userId)

            await tx.user.delete({
                where: { id: user.id },
            });
        });

        return successResponse({
            success: true,
            message: "Your account has been permanently deleted",
        });
    } catch (error) {
        return handleError(error);
    }
}
