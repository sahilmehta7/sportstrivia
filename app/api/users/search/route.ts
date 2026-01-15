import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { FriendStatus } from "@prisma/client";

// GET /api/users/search - Search users by name
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);

        const query = searchParams.get("q")?.trim();
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

        if (!query || query.length < 2) {
            throw new BadRequestError("Search query must be at least 2 characters");
        }

        // Search users by name (case-insensitive)
        const users = await prisma.user.findMany({
            where: {
                id: { not: user.id }, // Exclude self
                name: { contains: query, mode: "insensitive" },
            },
            select: {
                id: true,
                name: true,
                image: true,
                experienceTier: true,
                // Don't expose email for privacy
            },
            take: limit,
            orderBy: { name: "asc" },
        });

        // Check existing friendship status for each user
        const userIds = users.map((u) => u.id);
        const existingFriendships = await prisma.friend.findMany({
            where: {
                OR: [
                    { userId: user.id, friendId: { in: userIds } },
                    { userId: { in: userIds }, friendId: user.id },
                ],
            },
            select: {
                userId: true,
                friendId: true,
                status: true,
            },
        });

        // Build friendship status map
        const friendshipMap = new Map<string, { status: FriendStatus; direction: "sent" | "received" }>();
        for (const friendship of existingFriendships) {
            const otherUserId = friendship.userId === user.id ? friendship.friendId : friendship.userId;
            const direction = friendship.userId === user.id ? "sent" : "received";
            friendshipMap.set(otherUserId, { status: friendship.status, direction });
        }

        // Enrich results with friendship status
        const enrichedUsers = users.map((u) => {
            const friendship = friendshipMap.get(u.id);
            return {
                ...u,
                friendshipStatus: friendship?.status ?? null,
                friendshipDirection: friendship?.direction ?? null,
                canSendRequest: !friendship,
            };
        });

        return successResponse({
            users: enrichedUsers,
            total: enrichedUsers.length,
        });
    } catch (error) {
        return handleError(error);
    }
}
